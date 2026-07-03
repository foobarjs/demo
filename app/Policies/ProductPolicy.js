import { Policy } from '@foobarjs/framework';
import Product from '#app/Models/Product.js';

export default class ProductPolicy extends Policy {
  static model = Product;

  viewAny() { return true; }
  view() { return true; }
  create() { return true; }
  update() { return true; }
  delete() { return true; }
  apiStore({ user }) { return user?.role === 'admin'; }
  apiUpdate({ user }) { return user?.role === 'admin'; }
  apiDelete({ user }) { return user?.role === 'admin'; }
  ['action:archive']() { return true; }
  ['action:restock']() { return true; }
}
