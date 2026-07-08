import { Notification } from 'foobarjs/notifications'

class OrderShipped extends Notification {
  constructor(order) {
    super()
    this.order = order
  }

  via() {
    return ['database', 'mail']
  }

  toDatabase() {
    return {
      title: 'Order Shipped',
      message: `Order #${this.order.id} has been shipped.`,
      orderId: this.order.id,
    }
  }

  toMail() {
    return {
      subject: `Order #${this.order.id} Shipped`,
      text: `Your order #${this.order.id} has been shipped.`,
    }
  }
}

export default OrderShipped
