import Attendee from '../models/attendee.model.js'

/**
 * Ensures the current authenticated identity is an Attendee (portal actor),
 * not a User (admin/organizer) or nobody. Redirects to /tickets if not.
 *
 * `static global = false` — the framework registers this as an aliased,
 * opt-in middleware ('RequireAttendee'), not a global one that runs on
 * every request. Reference it explicitly on the controllers that need it:
 *
 *   static middleware = { use: ['auth', 'RequireAttendee'], only: ['my'] }
 */
class RequireAttendee {
  static global = false

  async handle(c, next) {
    const user = c.get('user')
    if (!(user instanceof Attendee)) {
      const session = c.get('session')
      if (session) session.flash('error', 'Sign in with your ticket email to view this page.')
      return c.redirect('/tickets')
    }
    return next()
  }
}

export default RequireAttendee
