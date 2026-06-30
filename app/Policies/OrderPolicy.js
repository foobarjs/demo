import { policy } from '@foobarjs/framework';

export default policy('Order', {
  viewAny: ({ user }) => user?.role === 'admin',
  view: ({ user }) => user?.role === 'admin',
  create: ({ user }) => user?.role === 'admin',
  update: ({ user }) => user?.role === 'admin',
  delete: false,
  'action:markPaid': ({ user }) => user?.role === 'admin',
  'action:fulfill': ({ user }) => user?.role === 'admin',
  'action:cancelWithReason': ({ user }) => user?.role === 'admin',
  'action:cancelSelected': ({ user }) => user?.role === 'admin',
});
