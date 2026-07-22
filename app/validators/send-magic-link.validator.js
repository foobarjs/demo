import { FormRequest } from 'foobarjs/validation'
import { Field } from 'foobarjs/orm'

class SendMagicLinkValidator extends FormRequest {
  rules() {
    return {
      email: Field.string().required().email().maxLength(255),
    }
  }
}

export default SendMagicLinkValidator
