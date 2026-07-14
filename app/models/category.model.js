import { Model, Field } from 'foobarjs/orm'
import Product from './product.model.js'

class Category extends Model {
  static schema = {
    name: Field.string().required(),
    slug: Field.string().required().unique(),
    description: Field.text().nullable(),
    products: Field.hasMany(() => Product),
  }

  static timestamps = true
  static tableName = 'categories'
}

export default Category
