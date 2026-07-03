import { Model, field } from '@foobarjs/framework';
import Order from './Order.js';
import Product from './Product.js';

export default class OrderItem extends Model {
  static indexes = ['orderId', 'productId', 'sku'];

  order = field.belongsTo(Order).required();
  product = field.belongsTo(Product).required();
  name = field.string().required().max(180);
  sku = field.string().required().max(80);
  quantity = field.integer().required().min(1);
  unitPrice = field.decimal({ precision: 10, scale: 2 }).required().min(0);
  total = field.decimal({ precision: 10, scale: 2 }).required().min(0);
}
