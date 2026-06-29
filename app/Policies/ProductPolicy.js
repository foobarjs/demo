import { policy } from '@foobarjs/framework';

export default policy('Product', {
  viewAny: true,
  view: true,
  create: true,
  update: true,
  delete: true,
  'action:archive': true,
  'action:restock': true,
});
