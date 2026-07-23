import { Controller } from 'foobarjs/core'
import { Model } from 'foobarjs/orm'
import { Event as EventDispatcher } from 'foobarjs/events'
import { Str } from 'foobarjs/support'
import Event from '../models/event.model.js'
import TicketType from '../models/ticket-type.model.js'
import Order from '../models/order.model.js'
import Attendee from '../models/attendee.model.js'
import DiscountCode from '../models/discount-code.model.js'
import OrderPlaced from '../events/order-placed.event.js'
import CheckoutValidator from '../validators/checkout.validator.js'

// Web-only controller — renders HTML views and issues redirects with flash
// messages. For JSON checkout, expose a separate handler in routes/api.js
// (or app/api/*.api.js) so the response contract stays predictable per route.
class CheckoutController extends Controller {
  static withoutMiddleware = ["auth"]

  async index() {
    const eventId = this.query('event')
    if (!eventId) return this.redirect('/')
    const event = await Event.find(eventId)
    if (!event || event.status !== 'published') return this.redirect('/')
    const ticketTypes = await TicketType.where('event_id', event.id).get()
    return this.render('checkout/index', { event, ticketTypes })
  }

  async store() {
    const request = await this.validateOrBack(CheckoutValidator)
    const body = request.validated()
    const event = await Event.findOrFail(body.event_id)
    if (event.status !== 'published') {
      return this.back().withErrors({ event_id: ['This event is not available.'] }).withInput(body)
    }

    const ticketType = await TicketType.findOrFail(body.ticket_type_id)
    if (ticketType.event !== event.id) {
      return this.back().withErrors({ ticket_type_id: ['Invalid ticket type for this event.'] }).withInput(body)
    }

    const qty = body.quantity
    if (ticketType.sold + qty > ticketType.quantity) {
      return this.back().withErrors({ quantity: ['Not enough tickets available.'] }).withInput(body)
    }

    let subtotal = ticketType.price * qty
    let discount = 0

    if (body.discount_code) {
      const code = await DiscountCode.where('code', body.discount_code)
        .where('event', event.id).first()
      if (code && (!code.maxUses || code.usedCount < code.maxUses)) {
        if (code.type === 'percentage') {
          discount = subtotal * (code.value / 100)
        } else {
          discount = Math.min(code.value, subtotal)
        }
        await code.increment('usedCount')
      }
    }

    const total = Math.max(0, subtotal - discount)
    const orderNumber = `ORD-${Str.upper(Str.random(8))}`

    const result = await Model.transaction(async () => {
      const order = await Order.create({
        orderNumber,
        email: body.email,
        name: body.name,
        status: 'confirmed',
        paymentStatus: 'paid',
        subtotal,
        discount,
        total,
        event: event.id,
      })

      // Only the purchaser's own ticket (index 0) is auto-assigned.
      // Additional tickets in the same order start unassigned (name = null)
      // and share the purchaser's email so they show in the purchaser's
      // portal until each is assigned to a specific attendee.
      const attendees = []
      for (let i = 0; i < qty; i++) {
        const attendee = await Attendee.create({
          name: i === 0 ? body.name : null,
          email: body.email,
          ticketCode: Str.upper(Str.random(12)),
          order: order.id,
          ticketType: ticketType.id,
          event: event.id,
        })
        attendees.push(attendee)
      }

      await ticketType.increment('sold', qty)
      await EventDispatcher.dispatch(new OrderPlaced(order, attendees))
      return { order, attendees }
    })

    this.flash('success', `Order ${orderNumber} confirmed! Check your email for ticket details.`)
    return this.render('checkout/confirmation', {
      order: result.order,
      attendees: result.attendees,
      event,
      ticketType,
    })
  }
}

export default CheckoutController
