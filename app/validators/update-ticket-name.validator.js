import { FormRequest } from 'foobarjs/validation'
import { Field } from 'foobarjs/orm'

class UpdateTicketNameValidator extends FormRequest {
  rules() {
    return {
      name: Field.string().required().minLength(1).maxLength(120),
    }
  }
}

export default UpdateTicketNameValidator
