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

  static scopes() {
    return {
      admins: (qb) => qb.where('isAdmin', true),
    }
  }
}

export default User
