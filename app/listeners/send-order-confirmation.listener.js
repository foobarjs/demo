import OrderPlaced from '../events/order-placed.event.js'
import { Mailer } from 'foobarjs/mail'

class SendOrderConfirmation {
  static events = [OrderPlaced]

  async handle(event) {
    const { order, attendees } = event
    const ticketCodes = attendees.map(a => a.ticketCode).join(', ')
    await Mailer
      .to(order.email)
      .subject(`Order ${order.orderNumber} confirmed`)
      .text(`Hi ${order.name},\n\nYour order has been confirmed.\nTotal: $${order.total}\nTicket codes: ${ticketCodes}\n\nSee you at the event!`)
      .send()
  }
}

export default SendOrderConfirmation
