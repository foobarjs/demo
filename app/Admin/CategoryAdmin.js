import { AdminResource, column, filter } from '@foobarjs/framework/admin';
import Category from '#app/Models/Category.js';

export default class CategoryAdmin extends AdminResource {
  static model = Category;
  static label = 'Categories';
  static display = 'name';

  list = [
    column('name').searchable().sortable(),
    column('slug').searchable().sortable(),
    column('status').badge({ draft: 'secondary', active: 'success', archived: 'warning' }).sortable(),
    column('createdAt').date().sortable().label('Created'),
  ];

  filters = [
    filter.enum('status'),
  ];

  relationships = [
    { name: 'products', label: 'Products', perPage: 10 },
  ];
}
