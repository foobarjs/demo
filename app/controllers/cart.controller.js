import { Controller } from 'foobarjs/core'
import Product from '../models/product.model.js'

class CartController extends Controller {
  static auth = false
  async index() {
    const cart = this.c.get('session')?.get('cart') || []
    return this.render('cart/index', { cart, title: 'Cart' })
  }

  async store() {
    const body = this.body
    const productId = parseInt(body.product_id)
    const quantity = parseInt(body.quantity) || 1

    if (!productId) {
      return this.json({ error: 'Product ID is required' }, 422)
    }

    const product = await Product.find(productId)
    if (!product) {
      return this.json({ error: 'Product not found' }, 404)
    }

    const session = this.c.get('session')
    const cart = session.get('cart') || []
    const existing = cart.find(i => i.id === productId)

    if (existing) {
      existing.quantity += quantity
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        quantity,
      })
    }

    session.set('cart', cart)
    session.flash('success', `Added ${product.name} to cart`)

    const referer = this.header('Referer') || '/cart'
    if (this.header('Accept')?.includes('json')) {
      return this.json({ cart, count: cart.reduce((s, i) => s + i.quantity, 0) })
    }
    return this.redirect(referer)
  }

  async update() {
    const id = parseInt(this.param('id'))
    const body = this.body
    const quantity = parseInt(body.quantity)

    if (!quantity || quantity < 1) {
      return this.json({ error: 'Quantity must be at least 1' }, 422)
    }

    const session = this.c.get('session')
    const cart = session.get('cart') || []
    const item = cart.find(i => i.id === id)

    if (!item) {
      return this.json({ error: 'Item not found in cart' }, 404)
    }

    item.quantity = quantity
    session.set('cart', cart)
    return this.redirect('/cart')
  }

  async destroy() {
    const id = parseInt(this.param('id'))
    const session = this.c.get('session')
    const cart = (session.get('cart') || []).filter(i => i.id !== id)
    session.set('cart', cart)
    return this.redirect('/cart')
  }
}

export default CartController
