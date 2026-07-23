import { FormRequest } from 'foobarjs/validation'
import { Field } from 'foobarjs/orm'

class CheckoutValidator extends FormRequest {
  rules() {
    return {
      name: Field.string().required().minLength(2),
      email: Field.string().required().email().lowercase(),
      event_id: Field.string().required(),
      ticket_type_id: Field.string().required(),
      quantity: Field.number().integer().required().min(1).max(10),
    }
  }
}

export default CheckoutValidator
