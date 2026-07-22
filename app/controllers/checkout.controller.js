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

class CheckoutController extends Controller {
  static auth = false

  async index() {
    const eventId = this.query('event')
    if (!eventId) return this.redirect('/')
    const event = await Event.find(eventId)
    if (!event || event.status !== 'published') return this.redirect('/')
    const ticketTypes = await TicketType.where('event_id', event.id).get()
    return this.render('checkout/index', { event, ticketTypes })
  }

  async store() {
    let request
    try {
      request = await this.validate(CheckoutValidator)
    } catch (err) {
      if (err.name === 'ValidationError') {
        if (this.wantsJson()) return this.json({ errors: err.errors }, 422)
        return this.back().withErrors(err).withInput(err.input)
      }
      throw err
    }

    const body = request.validated()
    const event = await Event.find(body.event_id)
    if (!event || event.status !== 'published') {
      return this.json({ error: 'Event not available' }, 422)
    }

    const ticketType = await TicketType.find(body.ticket_type_id)
    if (!ticketType || ticketType.event !== event.id) {
      return this.json({ error: 'Invalid ticket type' }, 422)
    }

    const qty = parseInt(body.quantity) || 1
    if (ticketType.sold + qty > ticketType.quantity) {
      if (this.wantsJson()) return this.json({ error: 'Not enough tickets available' }, 422)
      return this.back().withErrors({ quantity: ['Not enough tickets available'] }).withInput(body)
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
    const orderNumber = `ORD-${Str.random(8).toUpperCase()}`

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
      // Additional tickets in the same order are created UNASSIGNED (name = null)
      // and share the purchaser's email so they show in the purchaser's portal
      // until the purchaser assigns each to a specific attendee name.
      const attendees = []
      for (let i = 0; i < qty; i++) {
        const attendee = await Attendee.create({
          name: i === 0 ? body.name : null,
          email: body.email,
          ticketCode: Str.random(12).toUpperCase(),
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

    if (this.wantsJson()) {
      return this.json(result, 201)
    }

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
