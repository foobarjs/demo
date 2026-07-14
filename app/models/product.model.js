import { Model, Field } from 'foobarjs/orm'
import Category from './category.model.js'
import Tag from './tag.model.js'

class Product extends Model {
  static schema = {
    name: Field.string().required(),
    slug: Field.string().required().unique(),
    description: Field.text().nullable(),
    price: Field.float().required().unsigned(),
    stock: Field.number().default(0).unsigned(),
    image: Field.image().nullable(),
    published: Field.boolean().default(false).index(),
    category: Field.belongsTo(() => Category),
    tags: Field.belongsToMany(() => Tag),
  }

  static timestamps = true

  static indexes = [
    { columns: ['category', 'published'] },
  ]
}

export default Product
