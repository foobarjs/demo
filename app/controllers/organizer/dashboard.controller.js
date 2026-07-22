import { Controller } from 'foobarjs/core'
import Event from '../../models/event.model.js'
import Order from '../../models/order.model.js'
import Attendee from '../../models/attendee.model.js'

class DashboardController extends Controller {
  static middleware = ['auth', 'RequireUser']

  async index() {
    const user = this.user
    const events = await Event.where('organizer_id', user.id)
      .orderBy('startsAt', 'desc').get()
    const eventIds = events.map(e => e.id)

    let totalRevenue = 0
    let totalAttendees = 0
    if (eventIds.length) {
      for (const id of eventIds) {
        const orders = await Order.where('event_id', id).where('status', 'confirmed').get()
        totalRevenue += orders.reduce((sum, o) => sum + (o.total || 0), 0)
        const count = await Attendee.where('event_id', id).count()
        totalAttendees += count
      }
    }

    return this.render('organizer/dashboard', {
      events,
      totalRevenue,
      totalAttendees,
    })
  }

  async exportAttendees() {
    const eventId = this.query('event')
    if (!eventId) return this.json({ error: 'Event ID required' }, 400)

    const event = await Event.find(eventId)
    if (!event) return this.json({ error: 'Event not found' }, 404)

    await this.authorize('view', event)

    const attendees = await Attendee.where('event_id', event.id).get()
    const rows = attendees.map(a => ({
      name: a.name,
      email: a.email,
      ticketCode: a.ticketCode,
      checkedIn: a.checkedInAt ? 'Yes' : 'No',
    }))

    return this.downloadCsv(rows, `${event.slug}-attendees.csv`)
  }
}

export default DashboardController
