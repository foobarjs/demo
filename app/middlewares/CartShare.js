export default async function CartShare(c, next) {
  const session = c.get('session')
  const cart = session?.get('cart') || []
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0)
  c.share('cartCount', cartCount)
  await next()
}
