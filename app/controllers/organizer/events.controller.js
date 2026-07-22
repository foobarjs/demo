import { Controller } from 'foobarjs/core'
import { Str } from 'foobarjs/support'
import Event from '../../models/event.model.js'

class EventsController extends Controller {
  static middleware = ['auth', 'RequireUser']

  async index() {
    const events = await Event.where('organizer_id', this.user.id)
      .orderBy('createdAt', 'desc').get()
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
    const event = await Event.find(this.param('id'))
    if (!event) return this.render('errors/404')
    await this.authorize('update', event)
    return this.render('organizer/events/form', { event })
  }

  async update() {
    const event = await Event.find(this.param('id'))
    if (!event) return this.render('errors/404')
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
    const event = await Event.find(this.param('id'))
    if (!event) return this.render('errors/404')
    await this.authorize('delete', event)
    await event.delete()
    this.flash('success', 'Event deleted.')
    return this.redirect('/organizer/events')
  }
}

export default EventsController
