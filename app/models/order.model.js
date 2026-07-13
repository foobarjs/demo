import { Model, Field } from 'foobarjs/orm'
import User from './user.model.js'

class Order extends Model {
  static schema = {
    user: Field.belongsTo(User),
    status: Field.string().enum('pending', 'processing', 'shipped', 'delivered', 'cancelled').default('pending').index(),
    total: Field.float().unsigned().default(0),
    shippingAddress: Field.text().nullable(),
    paidAt: Field.date().nullable(),
  }

  static timestamps = true

  static indexes = [
    { columns: ['user', 'created_at'] },
    { columns: ['status', 'created_at'], name: 'idx_orders_status_recent' },
  ]

  static checks = [
    { expression: 'total >= 0', name: 'chk_orders_total_nonnegative' },
  ]
}

export default Order
