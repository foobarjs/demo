import { Field } from 'foobarjs/orm'
import { AuthenticableModel } from 'foobarjs/auth'
import Order from './order.model.js'
import TicketType from './ticket-type.model.js'
import Event from './event.model.js'

class Attendee extends AuthenticableModel {
  static schema = {
    name: Field.string().nullable(),      // null = ticket is unassigned; purchaser can set it later
    email: Field.string().required().email().index(),
    checkedInAt: Field.datetime().nullable(),
    ticketCode: Field.string().required().unique(),
    order: Field.belongsTo(() => Order),
    ticketType: Field.belongsTo(() => TicketType),
    event: Field.belongsTo(() => Event),
  }

  static timestamps = true

  // Portal authentication: the email column is what identifies an attendee.
  // Multiple Attendee rows can share the same email (one per ticket bought);
  // the auth middleware treats email as the session key and any matching row
  // as "the identity". this.user.email is what portal queries key off of.
  static authIdentifierName = 'email'
}

export default Attendee
