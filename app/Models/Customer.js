import { Model, field } from '@foobarjs/framework';

export default class Customer extends Model {
  static indexes = ['email', 'status'];

  firstName = field.string().required().max(120);
  lastName = field.string().required().max(120);
  email = field.string().required().email().unique().max(255);
  phone = field.string().nullable().max(40);
  status = field.enum(['lead', 'active', 'vip', 'blocked']).default('active');
  orders = field.hasMany('Order');

  active() {
    return this.query().where('status', 'active');
  }

  vip() {
    return this.query().where('status', 'vip');
  }
}
