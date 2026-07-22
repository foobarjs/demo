import HomeController from '../app/controllers/home.controller.js'
import CheckoutController from '../app/controllers/checkout.controller.js'
import EventsController from '../app/controllers/events.controller.js'
import BoomController from '../app/controllers/boom.controller.js'
import DashboardController from '../app/controllers/organizer/dashboard.controller.js'
import TicketsController from '../app/controllers/tickets.controller.js'

export default function (router) {
  // Public pages
  router.get('/', HomeController, 'index').public().name('home')
  router.get('/health', (c) => c.json({ status: 'ok', uptime: process.uptime() })).public().name('health')
  router.get('/checkout', CheckoutController, 'index').public().name('checkout.index')
  router.post('/checkout', CheckoutController, 'store').public().name('checkout.store')
  router.get('/events', EventsController, 'index').public().name('events.index')
  router.get('/events/:id', EventsController, 'show').public().name('events.show')
  router.get('/boom', BoomController, 'index').public().name('boom')

  // Attendee portal — public entry (magic link) + auth-guarded actions.
  // `tickets.verify` is the name Url.signedRoute() targets when the
  // portal issues the magic link email.
  router.get('/tickets', TicketsController, 'index').public().name('tickets.index')
  router.post('/tickets/send', TicketsController, 'send').public().name('tickets.send')
  router.get('/tickets/verify', TicketsController, 'verify').public().name('tickets.verify')
  router.post('/tickets/logout', TicketsController, 'logoutPortal').public().name('tickets.logout')
  router.get('/tickets/my', TicketsController, 'my').name('tickets.my')
  router.get('/tickets/my/:id/edit', TicketsController, 'edit').name('tickets.edit')
  router.post('/tickets/my/:id', TicketsController, 'update').name('tickets.update')

  // /organizer/dashboard/export-attendees is a custom (non-REST) action;
  // convention routing only mounts REST verbs so we register it explicitly.
  // The dashboard/events REST routes themselves are convention-mounted from
  // app/controllers/organizer/ and auto-named organizer.dashboard.* / .events.*.
  router.get('/organizer/dashboard/export-attendees', DashboardController, 'exportAttendees')
    .name('organizer.dashboard.exportAttendees')
}
