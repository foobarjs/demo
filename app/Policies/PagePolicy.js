import { Policy } from '@foobarjs/framework';
import Page from '#app/Models/Page.js';

export default class PagePolicy extends Policy {
  static model = Page;

  viewAny({ user }) { return user?.role === 'admin'; }
  view({ user }) { return user?.role === 'admin'; }
  create({ user }) { return user?.role === 'admin'; }
  update({ user }) { return user?.role === 'admin'; }
  delete({ user }) { return user?.role === 'admin'; }
}
