import { adminResource, column, filter, lens } from '@foobarjs/framework';

export default adminResource('Customer', {
  label: 'Customers',
  display: 'email',
  list: [
    column('email').searchable().sortable(),
    column('firstName').searchable().sortable().label('First name'),
    column('lastName').searchable().sortable().label('Last name'),
    column('status').badge({ lead: 'secondary', active: 'success', vip: 'azure', blocked: 'danger' }).sortable(),
    column('createdAt').date().sortable().label('Joined'),
  ],
  filters: [
    filter.enum('status'),
  ],
  lenses: [
    lens('vip', {
      label: 'VIP',
      query: query => query.vip(),
    }),
  ],
  relationships: [
    { name: 'orders', label: 'Orders', perPage: 10 },
  ],
});
