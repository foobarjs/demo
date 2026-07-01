import { adminResource, column, filter } from '@foobarjs/framework/admin';

export default adminResource('Page', {
  label: 'Pages',
  display: 'title',
  list: [
    column('title').searchable().sortable(),
    column('slug').searchable().sortable(),
    column('status').badge({ draft: 'secondary', published: 'success' }).searchable().sortable(),
  ],
  filters: [
    filter.enum('status'),
  ],
});
