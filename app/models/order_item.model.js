import { Model, Field } from 'foobarjs/orm'
import Order from './order.model.js'
import Product from './product.model.js'

class OrderItem extends Model {
  static schema = {
    order: Field.belongsTo(() => Order),
    product: Field.belongsTo(() => Product),
    quantity: Field.number().required().unsigned(),
    price: Field.float().required().unsigned(),
  }

  static timestamps = true
}

export default OrderItem
