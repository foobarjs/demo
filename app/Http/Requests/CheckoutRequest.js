import { Request, field } from '@foobarjs/framework';

export default class CheckoutRequest extends Request {
  email = field.string().required().email().max(255);
  productId = field.integer().required().min(1);
  quantity = field.integer().required().min(1).max(10);
}
