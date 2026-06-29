import { event, field } from '@foobarjs/framework';

export default event('order.placed', {
  description: 'Fired when a customer completes checkout.',
  payload: {
    orderId: field.integer().required(),
    number: field.string().required(),
    email: field.string().required().email(),
    total: field.decimal({ precision: 10, scale: 2 }).required(),
  },
});
