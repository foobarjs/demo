import HomeController from '../app/controllers/home.controller.js'

// Explicit route registration. Only for routes the filename convention
// can't (or shouldn't) express.
//
// The filename convention handles the rest:
//   app/controllers/products.controller.js  -> /products REST resource
//   app/controllers/cart.controller.js      -> /cart REST resource
//   app/controllers/checkout.controller.js  -> /checkout REST resource
//   app/controllers/boom.controller.js      -> /boom (index only)
//
// After the "resource only registers defined methods" fix, controllers that
// define only `index()` (like BoomController) get exactly one route, not the
// full REST set.
//
// Docs: https://foobarjs.github.io/docs/routing.html
export default function (router) {
  // Root path. The filename convention has a `home` shortcut for this, but
  // an explicit line here is clearer for anyone reading the routes file.
  router.get('/', HomeController, 'index')

  // Inline callback — no controller class, useful for one-off endpoints
  // that don't warrant a full class.
  router.get('/health', (c) => c.json({ status: 'ok', uptime: process.uptime() }))
}
