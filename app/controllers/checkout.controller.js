import Order from '../models/order.model.js'
import OrderItem from '../models/order_item.model.js'
import OrderPlaced from '../events/order-placed.event.js'
import CheckoutValidator from '../validators/checkout.validator.js'
import { Event } from 'foobarjs/events'
import { Model } from 'foobarjs/orm'

class CheckoutController {
  async index(c) {
    const cart = c.get('session')?.get('cart') || []
    return c.render('checkout/index', { cart, title: 'Checkout' })
  }

  async store(c) {
    const request = await c.validate(CheckoutValidator)
    const session = c.get('session')
    const cart = session?.get('cart') || []

    if (!cart.length) {
      return c.json({ error: 'Cart is empty' }, 422)
    }

    const user = c.get('user')
    const total = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
    const body = request.validated()

    const order = await Model.transaction(async () => {
      const order = await Order.create({
        user: user?.id || null,
        status: 'pending',
        total,
        shippingAddress: body.address,
      })

      const items = []
      for (const item of cart) {
        const orderItem = await OrderItem.create({
          order: order.id,
          product: item.id,
          quantity: item.quantity,
          price: item.price,
        })
        items.push(orderItem)
      }

      await Event.dispatch(new OrderPlaced(order, items))
      return order
    })

    session.set('cart', [])
    return c.redirect('/')
  }
}

export default CheckoutController
