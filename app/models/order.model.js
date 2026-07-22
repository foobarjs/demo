import { Model, Field } from 'foobarjs/orm'
import Event from './event.model.js'

class Order extends Model {
  static schema = {
    orderNumber: Field.string().required().unique(),
    email: Field.string().required(),
    name: Field.string().required(),
    status: Field.string().enum('pending', 'confirmed', 'cancelled', 'refunded').default('pending').index(),
    paymentStatus: Field.string().enum('unpaid', 'paid', 'refunded').default('unpaid'),
    subtotal: Field.float().unsigned().default(0),
    discount: Field.float().unsigned().default(0),
    total: Field.float().unsigned().default(0),
    event: Field.belongsTo(() => Event),
  }

  static timestamps = true

  static checks = [
    { expression: 'total >= 0', name: 'chk_orders_total_nonneg' },
  ]
}

export default Order
