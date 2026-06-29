import { adminResource, column, filter } from '@foobarjs/framework';

export default adminResource('Category', {
  label: 'Categories',
  display: 'name',
  list: [
    column('name').searchable().sortable(),
    column('slug').searchable().sortable(),
    column('status').badge({ draft: 'secondary', active: 'success', archived: 'warning' }).sortable(),
    column('createdAt').date().sortable().label('Created'),
  ],
  filters: [
    filter.enum('status'),
  ],
  relationships: [
    { name: 'products', label: 'Products', perPage: 10 },
  ],
});
