import { policy } from '@foobarjs/framework';

export default policy('Order', {
  viewAny: true,
  view: true,
  create: true,
  update: true,
  delete: false,
  'action:markPaid': true,
  'action:fulfill': true,
  'action:cancelWithReason': true,
  'action:cancelSelected': true,
});
