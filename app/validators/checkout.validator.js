import { FormRequest } from 'foobarjs/validation'
import { Field } from 'foobarjs/orm'

class CheckoutValidator extends FormRequest {
  rules() {
    return {
      address: Field.string().required().minLength(5),
    }
  }
}

export default CheckoutValidator
