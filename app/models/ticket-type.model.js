import { Model, Field } from 'foobarjs/orm'
import Event from './event.model.js'

class TicketType extends Model {
  static schema = {
    name: Field.string().required(),
    description: Field.text().nullable(),
    price: Field.float().required().unsigned(),
    quantity: Field.number().required().unsigned(),
    sold: Field.number().default(0).unsigned(),
    salesStart: Field.datetime().nullable(),
    salesEnd: Field.datetime().nullable(),
    event: Field.belongsTo(() => Event),
  }

  static timestamps = true
}

export default TicketType
