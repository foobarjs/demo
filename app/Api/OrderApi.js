import { ApiResource } from '@foobarjs/framework';
import Order from '#app/Models/Order.js';

export default class OrderApi extends ApiResource {
  static model = Order;
  static path = '/api/orders';
  static resource = 'OrderResource';
  static actions = ['index', 'show'];
  static authorize = {
    index: 'viewAny',
    show: 'view',
  };
  static middleware = ['api'];
  static docs = {
    summary: 'Read-only order API for backoffice integrations.',
  };
}
