import { policy } from '@foobarjs/framework';

export default policy('Product', {
  viewAny: true,
  view: true,
  create: true,
  update: true,
  delete: true,
  apiStore: ({ user }) => user?.role === 'admin',
  apiUpdate: ({ user }) => user?.role === 'admin',
  apiDelete: ({ user }) => user?.role === 'admin',
  'action:archive': true,
  'action:restock': true,
});
