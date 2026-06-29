import { listener } from '@foobarjs/framework';

export default listener('order.placed', {
  name: 'QueueOrderReceipt',
  async handle({ queue }, payload) {
    queue('SendOrderReceipt', payload);
  },
});
