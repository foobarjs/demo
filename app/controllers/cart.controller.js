import Product from '../models/product.model.js'

class CartController {
  async index(c) {
    const cart = c.get('session')?.get('cart') || []
    return c.render('cart/index', { cart, title: 'Cart' })
  }

  async store(c) {
    const body = await c.req.parseBody()
    const productId = parseInt(body.product_id)
    const quantity = parseInt(body.quantity) || 1

    if (!productId) {
      return c.json({ error: 'Product ID is required' }, 422)
    }

    const product = await Product.find(productId)
    if (!product) {
      return c.json({ error: 'Product not found' }, 404)
    }

    const session = c.get('session')
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

    const referer = c.req.header('Referer') || '/cart'
    if (c.req.header('Accept')?.includes('json')) {
      return c.json({ cart, count: cart.reduce((s, i) => s + i.quantity, 0) })
    }
    return c.redirect(referer)
  }

  async update(c) {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.parseBody()
    const quantity = parseInt(body.quantity)

    if (!quantity || quantity < 1) {
      return c.json({ error: 'Quantity must be at least 1' }, 422)
    }

    const session = c.get('session')
    const cart = session.get('cart') || []
    const item = cart.find(i => i.id === id)

    if (!item) {
      return c.json({ error: 'Item not found in cart' }, 404)
    }

    item.quantity = quantity
    session.set('cart', cart)
    return c.redirect('/cart')
  }

  async destroy(c) {
    const id = parseInt(c.req.param('id'))
    const session = c.get('session')
    const cart = (session.get('cart') || []).filter(i => i.id !== id)
    session.set('cart', cart)
    return c.redirect('/cart')
  }
}

export default CartController
