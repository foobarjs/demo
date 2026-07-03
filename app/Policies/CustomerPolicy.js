import { Policy } from '@foobarjs/framework';
import Customer from '#app/Models/Customer.js';

export default class CustomerPolicy extends Policy {
  static model = Customer;

  viewAny({ user }) { return user?.role === 'admin'; }
  view({ user }) { return user?.role === 'admin'; }
}
