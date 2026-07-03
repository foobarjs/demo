import { Event, field } from '@foobarjs/framework';

export default class OrderPlaced extends Event {
  static description = 'Fired when a customer completes checkout.';

  orderId = field.integer().required();
  number = field.string().required();
  email = field.string().required().email();
  total = field.decimal({ precision: 10, scale: 2 }).required();
}
