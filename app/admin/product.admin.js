import { Admin, Column, Filter } from 'foobarjs/admin'
import Product from '../models/product.model.js'

export default Admin.resource(Product)
  .label('Products', 'Product')
  .icon('bi-box-seam')
  .group('Catalog')
  .displayLabel(p => p.name)
  .dashboard({})
  .permissions({
    view: ['admin', 'editor', 'viewer'],
    create: ['admin', 'editor'],
    edit: ['admin', 'editor'],
    delete: ['admin'],
  })
  .searchable('name', 'slug', 'description')
  .list(list => list
    .autoFilters(true)
    .persistFilters(true)
    .columns([
      Column.text('name').sortable().searchable(),
      Column.belongsTo('category'),
      Column.money('price').sortable(),
      Column.number('stock').sortable(),
      Column.boolean('published').sortable(false),
    ])
    .filters([
      Filter.boolean('published'),
      Filter.belongsTo('category'),
    ])
  )
  .form(form => form
    .fields(['name', 'slug', 'description', 'price', 'stock', 'image', 'published', 'category', 'tags'])
  )
