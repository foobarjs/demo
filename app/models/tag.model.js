import { Model, Field } from 'foobarjs/orm'

class Tag extends Model {
  static schema = {
    name: Field.string().required(),
    slug: Field.string().required().unique(),
  }

  static timestamps = true
}

export default Tag
