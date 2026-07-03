import { Model, field } from '@foobarjs/framework';
import Customer from './Customer.js';

export default class Order extends Model {
  static indexes = ['number', 'email', 'status', 'customerId'];

  number = field.string().required().unique().max(40);
  email = field.string().required().email().max(255);
  status = field.enum(['draft', 'pending', 'paid', 'fulfilled', 'cancelled', 'refunded']).default('pending');
  subtotal = field.decimal({ precision: 10, scale: 2 }).required().min(0);
  tax = field.decimal({ precision: 10, scale: 2 }).required().min(0).default(0);
  shipping = field.decimal({ precision: 10, scale: 2 }).required().min(0).default(0);
  total = field.decimal({ precision: 10, scale: 2 }).required().min(0);
  customer = field.belongsTo(Customer).nullable();
  items = field.hasMany('OrderItem', { foreignKey: 'orderId' });

  pending() {
    return this.query().where('status', 'pending');
  }

  paid() {
    return this.query().where('status', 'paid');
  }

  fulfilled() {
    return this.query().where('status', 'fulfilled');
  }

  highValue() {
    return this.query().where('total', '>=', 500);
  }
}
