import { field, request } from '@foobarjs/framework';

export default request('CheckoutRequest', {
  email: field.string().required().email().max(255),
  productId: field.integer().required().min(1),
  quantity: field.integer().required().min(1).max(10),
});
