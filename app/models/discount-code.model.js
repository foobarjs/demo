import { Model, Field } from 'foobarjs/orm'
import Event from './event.model.js'

class DiscountCode extends Model {
  static schema = {
    code: Field.string().required(),
    type: Field.string().enum('fixed', 'percentage').required(),
    value: Field.float().required().unsigned(),
    maxUses: Field.number().nullable(),
    usedCount: Field.number().default(0).unsigned(),
    expiresAt: Field.datetime().nullable(),
    event: Field.belongsTo(() => Event),
  }

  static timestamps = true

  static uniques = [
    { columns: ['code', 'event'] },
  ]
}

export default DiscountCode
