import { Policy } from '@foobarjs/framework';
import OrderItem from '#app/Models/OrderItem.js';

export default class OrderItemPolicy extends Policy {
  static model = OrderItem;

  viewAny({ user }) { return user?.role === 'admin'; }
  view({ user }) { return user?.role === 'admin'; }
  create({ user }) { return user?.role === 'admin'; }
  update({ user }) { return user?.role === 'admin'; }
  delete({ user }) { return user?.role === 'admin'; }
}
