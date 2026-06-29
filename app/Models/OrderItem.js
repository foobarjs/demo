import { belongsTo, field, model } from '@foobarjs/framework';

export default model('OrderItem', {
  ...field.id(),
  order: belongsTo('Order'),
  product: belongsTo('Product'),
  name: field.string().required().max(180),
  sku: field.string().required().max(80),
  quantity: field.integer().required().min(1),
  unitPrice: field.decimal({ precision: 10, scale: 2 }).required().min(0),
  total: field.decimal({ precision: 10, scale: 2 }).required().min(0),
  ...field.timestamps(),
}, {
  indexes: ['orderId', 'productId', 'sku'],
});
