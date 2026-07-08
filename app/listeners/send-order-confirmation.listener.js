import OrderPlaced from '../events/order-placed.event.js'
import { Mailer } from 'foobarjs/mail'

class SendOrderConfirmation {
  static events = [OrderPlaced]

  async handle(event) {
    const { order } = event
    await Mailer
      .to('customer@example.com')
      .subject(`Order #${order.id} confirmed`)
      .text(`Your order for $${order.total} has been received.`)
      .send()
  }
}

export default SendOrderConfirmation
