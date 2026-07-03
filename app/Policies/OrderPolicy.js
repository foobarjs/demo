import { Policy } from '@foobarjs/framework';
import Order from '#app/Models/Order.js';

export default class OrderPolicy extends Policy {
  static model = Order;

  viewAny({ user }) { return user?.role === 'admin'; }
  view({ user }) { return user?.role === 'admin'; }
  create({ user }) { return user?.role === 'admin'; }
  update({ user }) { return user?.role === 'admin'; }
  delete() { return false; }
  ['action:markPaid']({ user }) { return user?.role === 'admin'; }
  ['action:fulfill']({ user }) { return user?.role === 'admin'; }
  ['action:cancelWithReason']({ user }) { return user?.role === 'admin'; }
  ['action:cancelSelected']({ user }) { return user?.role === 'admin'; }
}
