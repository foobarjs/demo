import { Model, Field } from 'foobarjs/orm'
import User from './user.model.js'

class Profile extends Model {
  static schema = {
    bio: Field.text().nullable(),
    avatar: Field.string().nullable(),
    user: Field.belongsTo(User),
  }

  static timestamps = true
}

export default Profile
