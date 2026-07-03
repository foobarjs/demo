import { AdminResource, column, filter } from '@foobarjs/framework/admin';
import OrderItem from '#app/Models/OrderItem.js';

export default class OrderItemAdmin extends AdminResource {
  static model = OrderItem;
  static label = 'Order Items';
  static display = 'name';

  list = [
    column('order').relationship({ perPage: 25, placeholder: 'Search orders' }),
    column('product').relationship({ perPage: 25, placeholder: 'Search products' }),
    column('name').searchable().sortable(),
    column('sku').searchable().sortable().label('SKU'),
    column('quantity').sortable(),
    column('unitPrice').money('USD').sortable().label('Unit price'),
    column('total').money('USD').sortable(),
  ];

  filters = [
    filter.relationship('order', { perPage: 25 }).placeholder('Search orders'),
    filter.relationship('product', { perPage: 25 }).placeholder('Search products'),
  ];
}
