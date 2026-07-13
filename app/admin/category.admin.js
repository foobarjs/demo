import { Admin, Column } from 'foobarjs/admin'
import Category from '../models/category.model.js'

export default Admin.resource(Category)
  .label('Categories', 'Category')
  .icon('bi-tags')
  .group('Catalog')
  .displayLabel(c => c.name)
  .searchable('name', 'slug')
  .list(list => list
    .columns([
      Column.text('name').sortable().searchable(),
      Column.text('slug').sortable(),
      Column.text('description'),
    ])
  )
  .form(form => form
    .fields(['name', 'slug', 'description'])
  )
