import { Controller } from 'foobarjs/core'
import { Str } from 'foobarjs/support'
import { GateRegistry } from 'foobarjs/auth'
import Event from '../../models/event.model.js'

class EventsController extends Controller {
  // Every /organizer/* controller must apply this pair — 'auth' first,
  // then 'RequireUser' to reject Attendee-portal sessions from this area.
  static middleware = ['auth', 'RequireUser']

  async index() {
    // Delegate scoping to the Event gate — a single source of truth.
    // Admins see everything, organizers see their own; whatever the gate
    // scope() closure declares applies here without duplication.
    const query = GateRegistry.getInstance().applyScope(this.user, Event, Event.query())
    const events = await query.orderBy('createdAt', 'desc').get()
    return this.render('organizer/events/index', { events })
  }

  async new() {
    return this.render('organizer/events/form', { event: null })
  }

  async store() {
    const body = this.body
    const event = await Event.create({
      title: body.title,
      slug: Str.slug(body.title),
      description: body.description || null,
      startsAt: body.startsAt,
      endsAt: body.endsAt || null,
      venue: body.venue || null,
      location: body.location || null,
      status: 'draft',
      organizer: this.user.id,
    })
    this.flash('success', 'Event created successfully.')
    return this.redirect('/organizer/events')
  }

  async edit() {
    const event = await Event.findOrFail(this.param('id'))
    await this.authorize('update', event)
    return this.render('organizer/events/form', { event })
  }

  async update() {
    const event = await Event.findOrFail(this.param('id'))
    await this.authorize('update', event)
    const body = this.body
    event.fill({
      title: body.title,
      description: body.description || null,
      startsAt: body.startsAt,
      endsAt: body.endsAt || null,
      venue: body.venue || null,
      location: body.location || null,
      status: body.status || event.status,
    })
    if (body.title && body.title !== event.title) {
      event.slug = Str.slug(body.title)
    }
    await event.save()
    this.flash('success', 'Event updated successfully.')
    return this.redirect('/organizer/events')
  }

  async destroy() {
    const event = await Event.findOrFail(this.param('id'))
    await this.authorize('delete', event)
    await event.delete()
    this.flash('success', 'Event deleted.')
    return this.redirect('/organizer/events')
  }
}

export default EventsController
