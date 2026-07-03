import { Listener } from '@foobarjs/framework';
import OrderPlaced from '#app/Events/OrderPlaced.js';
import SendOrderReceipt from '#app/Jobs/SendOrderReceipt.js';

export default class QueueOrderReceipt extends Listener {
  static event = OrderPlaced;

  async handle({ queue }, payload) {
    queue(SendOrderReceipt, payload);
  }
}
