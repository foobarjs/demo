import { Notification } from 'foobarjs/notifications'

class OrderShipped extends Notification {
  constructor(order) {
    super()
    this.order = order
  }

  via() {
    return ['database']
  }

  toDatabase() {
    return {
      orderId: this.order.id,
      message: `Order #${this.order.id} has been shipped`,
    }
  }
}

export default OrderShipped
