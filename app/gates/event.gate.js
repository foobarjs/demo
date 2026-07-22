import { Gate } from 'foobarjs/auth'
import Event from '../models/event.model.js'
import User from '../models/user.model.js'

// Back-office gate. Actor is always expected to be a User (admin/organizer).
// Portal/Attendee sessions never manage events, so we short-circuit false
// if the current identity isn't a User — belt-and-suspenders alongside
// admin/organizer route protection.
const isUser = (u) => u instanceof User

export default Gate({
  model: Event,

  viewAny(user) {
    return isUser(user)
  },

  view(user, event) {
    if (!isUser(user)) return false
    if (!event) return true
    return user.isAdmin || event.organizer === user.id
  },

  create(user) {
    return isUser(user)
  },

  update(user, event) {
    if (!isUser(user)) return false
    if (!event) return true
    return user.isAdmin || event.organizer === user.id
  },

  delete(user, event) {
    if (!isUser(user)) return false
    if (!event) return user.isAdmin
    return user.isAdmin || event.organizer === user.id
  },

  scope(user, query) {
    if (!isUser(user)) return query.where('organizer_id', -1)   // no results
    if (user.isAdmin) return query
    return query.where('organizer_id', user.id)
  },
})
