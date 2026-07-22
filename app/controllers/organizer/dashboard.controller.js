import { Controller } from 'foobarjs/core'
import User from '../../models/user.model.js'
import Event from '../../models/event.model.js'
import Attendee from '../../models/attendee.model.js'

class DashboardController extends Controller {
  // Every /organizer/* controller must apply this pair — 'auth' first,
  // then 'RequireUser' to reject Attendee-portal sessions from this area.
  static middleware = ['auth', 'RequireUser']

  async index() {
    // One eager-load-with-aggregates roundtrip: pulls the organizer's events
    // (ordered), the confirmed-order revenue rolled up through events.orders,
    // and the total attendee count rolled up through events.attendees.
    // Framework compiles this to hops+1 queries per through-aggregate, no
    // JOINs, and auto-chunks bind lists at the driver limit.
    const user = await User.query()
      .where('id', this.user.id)
      .with('events', q => q.orderBy('startsAt', 'desc'))
      .withSum('events.orders', 'total', q => q.where('status', 'confirmed'))
      .withCount('events.attendees')
      .first()

    return this.render('organizer/dashboard', {
      events: user.events || [],
      totalRevenue: user.eventsOrdersSumTotal || 0,
      totalAttendees: user.eventsAttendeesCount || 0,
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
