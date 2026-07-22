import { Gate } from 'foobarjs/auth'
import Attendee from '../models/attendee.model.js'
import User from '../models/user.model.js'

// Attendee gate covers BOTH the back-office (User actor) and the portal
// (Attendee actor). Each closure branches on the actor type.
const isUser = (u) => u instanceof User
const isAttendee = (u) => u instanceof Attendee

export default Gate({
  model: Attendee,

  viewAny(user) {
    return isUser(user) || isAttendee(user)
  },

  view(user, ticket) {
    if (isUser(user)) return true
    if (isAttendee(user)) return !!ticket && ticket.email === user.email
    return false
  },

  create(user) {
    return isUser(user) && user.isAdmin
  },

  // Only the portal exposes this — the ticket owner can edit the name only.
  updateName(user, ticket) {
    return isAttendee(user) && !!ticket && ticket.email === user.email
  },

  // Full update (email, event, ticketCode, etc.) is admin-only in the back office.
  update(user, ticket) {
    return isUser(user) && user.isAdmin
  },

  delete(user, ticket) {
    return isUser(user) && user.isAdmin
  },

  scope(user, query) {
    if (isUser(user)) return query                             // admins see all
    if (isAttendee(user)) return query.where('email', user.email)
    return query.where('id', -1)
  },
})
