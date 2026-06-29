import { belongsTo, field, hasMany, model } from '@foobarjs/framework';

export default model('Order', {
  ...field.id(),
  number: field.string().required().unique().max(40),
  email: field.string().required().email().max(255),
  status: field.enum(['draft', 'pending', 'paid', 'fulfilled', 'cancelled', 'refunded']).default('pending'),
  subtotal: field.decimal({ precision: 10, scale: 2 }).required().min(0),
  tax: field.decimal({ precision: 10, scale: 2 }).required().min(0).default(0),
  shipping: field.decimal({ precision: 10, scale: 2 }).required().min(0).default(0),
  total: field.decimal({ precision: 10, scale: 2 }).required().min(0),
  customer: belongsTo('Customer').nullable(),
  items: hasMany('OrderItem'),
  ...field.timestamps(),
}, {
  indexes: ['number', 'email', 'status', 'customerId'],
  scopes: {
    pending: query => query.where('status', 'pending'),
    paid: query => query.where('status', 'paid'),
    fulfilled: query => query.where('status', 'fulfilled'),
    highValue: query => query.where('total', '>=', 500),
  },
});
