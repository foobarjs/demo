import { Controller, NotFoundError } from 'foobarjs/core'
import Event from '../models/event.model.js'
import TicketType from '../models/ticket-type.model.js'

class EventsController extends Controller {
  static auth = false

  async index() {
    const events = await this.paginate(
      Event.where('status', 'published').orderBy('startsAt', 'asc')
    )
    return this.render('events/index', { events })
  }

  async show() {
    const slug = this.param('id')
    const event = await Event.where('slug', slug).first()
    if (!event) throw new NotFoundError('Event not found')
    const ticketTypes = await TicketType.where('event_id', event.id).get()
    return this.render('events/show', { event, ticketTypes })
  }
}

export default EventsController
