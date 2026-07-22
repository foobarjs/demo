import { Model, Field } from 'foobarjs/orm'
import User from './user.model.js'
import TicketType from './ticket-type.model.js'
import Order from './order.model.js'
import Attendee from './attendee.model.js'

class Event extends Model {
  static schema = {
    title: Field.string().required(),
    slug: Field.string().required().unique(),
    description: Field.text().nullable(),
    startsAt: Field.datetime().required(),
    endsAt: Field.datetime().nullable(),
    venue: Field.string().nullable(),
    location: Field.string().nullable(),
    status: Field.string().enum('draft', 'published', 'cancelled', 'completed').default('draft').index(),
    coverImage: Field.image().storagePath('events').nullable(),
    maxAttendees: Field.number().nullable(),
    speakers: Field.json().nullable(),
    schedule: Field.json().nullable(),
    organizer: Field.belongsTo(() => User),
    ticketTypes: Field.hasMany(() => TicketType),
    orders: Field.hasMany(() => Order),
    attendees: Field.hasMany(() => Attendee),
  }

  static timestamps = true

  static indexes = [
    { columns: ['organizer', 'status'] },
    { columns: ['startsAt'] },
  ]

  static scopes() {
    return {
      published: (qb) => qb.where('status', 'published'),
      upcoming: (qb) => qb.where('status', 'published').where('startsAt', '>', new Date().toISOString()),
    }
  }
}

export default Event
