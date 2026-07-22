import HomeController from '../app/controllers/home.controller.js'
import CheckoutController from '../app/controllers/checkout.controller.js'
import EventsController from '../app/controllers/events.controller.js'
import BoomController from '../app/controllers/boom.controller.js'
import DashboardController from '../app/controllers/organizer/dashboard.controller.js'
import TicketsController from '../app/controllers/tickets.controller.js'

export default function (router) {
  router.get('/', HomeController, 'index').public()
  router.get('/health', (c) => c.json({ status: 'ok', uptime: process.uptime() })).public()
  router.get('/checkout', CheckoutController, 'index').public()
  router.post('/checkout', CheckoutController, 'store').public()
  router.get('/events', EventsController, 'index').public()
  router.get('/events/:id', EventsController, 'show').public()
  router.get('/organizer/dashboard/export-attendees', DashboardController, 'exportAttendees')
  router.get('/boom', BoomController, 'index').public()

  // Attendee portal — public entry (magic link) + auth-guarded actions
  router.get('/tickets', TicketsController, 'index').public()
  router.post('/tickets/send', TicketsController, 'send').public()
  router.get('/tickets/verify', TicketsController, 'verify').public()
  router.post('/tickets/logout', TicketsController, 'logoutPortal').public()
  router.get('/tickets/my', TicketsController, 'my')
  router.get('/tickets/my/:id/edit', TicketsController, 'edit')
  router.post('/tickets/my/:id', TicketsController, 'update')
}
