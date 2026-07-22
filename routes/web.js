import DashboardController from '../app/controllers/organizer/dashboard.controller.js'
import TicketsController from '../app/controllers/tickets.controller.js'

export default function (router) {
  // Convention routing auto-mounts app/controllers/*.controller.js at REST
  // paths (e.g. home → GET /, checkout → GET|POST /checkout, events →
  // GET /events + GET /events/:id, boom → GET /boom). Everything below is
  // for routes that DON'T match REST conventions or that need custom paths.

  // Health endpoint — inline handler, not a controller.
  router.get('/health', (c) => c.json({ status: 'ok', uptime: process.uptime() })).public().name('health')

  // Attendee portal — custom paths. Declaring `edit`/`update` here claims
  // TicketsController#edit and #update, so the framework SKIPS the REST
  // defaults at /tickets/:id/edit and PUT /tickets/:id (v0.3.0 behavior).
  // Also: the convention-mounted GET /tickets already provides `tickets.index`.
  router.post('/tickets/send', TicketsController, 'send').public().name('tickets.send')
  router.get('/tickets/verify', TicketsController, 'verify').public().name('tickets.verify')
  router.post('/tickets/logout', TicketsController, 'logoutPortal').public().name('tickets.logout')
  router.get('/tickets/my', TicketsController, 'my').name('tickets.my')
  router.get('/tickets/my/:id/edit', TicketsController, 'edit').name('tickets.edit')
  router.post('/tickets/my/:id', TicketsController, 'update').name('tickets.update')

  // Custom (non-REST) action; convention only mounts REST verbs so this is explicit.
  // The dashboard/events REST routes themselves are convention-mounted from
  // app/controllers/organizer/ and auto-named organizer.dashboard.* / .events.*.
  router.get('/organizer/dashboard/export-attendees', DashboardController, 'exportAttendees')
    .name('organizer.dashboard.exportAttendees')
}
