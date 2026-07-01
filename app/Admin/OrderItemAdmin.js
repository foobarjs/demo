import { adminResource, column, filter } from '@foobarjs/framework/admin';

export default adminResource('OrderItem', {
  label: 'Order Items',
  display: 'name',
  list: [
    column('order').relationship({ perPage: 25, placeholder: 'Search orders' }),
    column('product').relationship({ perPage: 25, placeholder: 'Search products' }),
    column('name').searchable().sortable(),
    column('sku').searchable().sortable().label('SKU'),
    column('quantity').sortable(),
    column('unitPrice').money('USD').sortable().label('Unit price'),
    column('total').money('USD').sortable(),
  ],
  filters: [
    filter.relationship('order', { perPage: 25 }).placeholder('Search orders'),
    filter.relationship('product', { perPage: 25 }).placeholder('Search products'),
  ],
});
