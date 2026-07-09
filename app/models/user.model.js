import { AuthenticableModel } from 'foobarjs/auth'
import { Field } from 'foobarjs/orm'

class User extends AuthenticableModel {
  static schema = {
    name: Field.string().required(),
    email: Field.string().required().unique(),
    password: Field.string().required().hidden(),
    isAdmin: Field.boolean().default(false),
    roles: Field.json().nullable(),
    profile: Field.hasOne('Profile'),
  }

  static timestamps = true

  // Privilege and structural fields are never mass-assignable (e.g. via the
  // auto API or admin forms). Set them explicitly with forceFill() in trusted
  // server-side code.
  static guarded = ['id', 'isAdmin', 'roles', 'created_at', 'updated_at']

  static scopes() {
    return {
      admins: (qb) => qb.where('isAdmin', true),
    }
  }
}

export default User
