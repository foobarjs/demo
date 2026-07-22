import { Gate } from 'foobarjs/auth'
import Order from '../models/order.model.js'
import User from '../models/user.model.js'

// Back-office gate for Orders. Portal users manage their own orders via
// email match — that's separate from this gate.
const isUser = (u) => u instanceof User

export default Gate({
  model: Order,

  viewAny(user) {
    return isUser(user)
  },

  view(user, order) {
    return isUser(user)
  },

  create(user) {
    return isUser(user) && user.isAdmin
  },

  update(user, order) {
    return isUser(user) && user.isAdmin
  },

  delete(user, order) {
    return isUser(user) && user.isAdmin
  },

  scope(user, query) {
    if (!isUser(user)) return query.where('id', -1)
    return query
  },
})
