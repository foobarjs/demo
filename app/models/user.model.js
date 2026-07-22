import { AuthenticableModel } from 'foobarjs/auth'
import { Field } from 'foobarjs/orm'
import Event from './event.model.js'

class User extends AuthenticableModel {

  static api = false

  static schema = {
    name: Field.string().required(),
    email: Field.string().required().unique(),
    password: Field.string().required().hidden(),
    isAdmin: Field.boolean().default(false),
    roles: Field.json().enum('admin', 'organizer').multiple().nullable(),
    // Inverse of Event.organizer; used by the organizer dashboard for
    // withCount / withSum through aggregates like `events.orders`.
    events: Field.hasMany(() => Event),
  }

  static timestamps = true

  // Privilege and structural fields are never mass-assignable (e.g. via the
  // auto API or admin forms). Set them explicitly with forceFill() in trusted
  // server-side code.
  static guarded = ['id', 'isAdmin', 'createdAt', 'updatedAt']

  static scopes() {
    return {
      admins: (qb) => qb.where('isAdmin', true),
    }
  }
}

export default User
