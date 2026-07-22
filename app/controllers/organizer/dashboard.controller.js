import { Controller } from 'foobarjs/core'
import Event from '../../models/event.model.js'
import Order from '../../models/order.model.js'
import Attendee from '../../models/attendee.model.js'

class DashboardController extends Controller {
  // Every /organizer/* controller must apply this pair — 'auth' first,
  // then 'RequireUser' to reject Attendee-portal sessions from this area.
  static middleware = ['auth', 'RequireUser']

  async index() {
    const user = this.user
    const events = await Event.where('organizer_id', user.id)
      .orderBy('startsAt', 'desc').get()
    const eventIds = events.map(e => e.id)

    // Two aggregate queries total, regardless of event count.
    const [totalRevenue, totalAttendees] = eventIds.length
      ? await Promise.all([
          Order.query().whereIn('event', eventIds).where('status', 'confirmed').sum('total'),
          Attendee.query().whereIn('event', eventIds).count(),
        ])
      : [0, 0]

    return this.render('organizer/dashboard', {
      events,
      totalRevenue: totalRevenue || 0,
      totalAttendees,
    })
  }

  async exportAttendees() {
    const eventId = this.query('event')
    if (!eventId) return this.redirect('/organizer/dashboard')

    const event = await Event.findOrFail(eventId)
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
