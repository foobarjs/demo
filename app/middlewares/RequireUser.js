import User from '../models/user.model.js'

/**
 * Ensures the current authenticated identity is a User (account holder:
 * admin, organizer, etc.), not an Attendee portal session. Redirects
 * attendees to the portal, unauthenticated users to /login.
 *
 * `static global = false` — aliased, opt-in only. Reference by name from
 * controllers that need it:
 *
 *   static middleware = ['auth', 'RequireUser']
 */
class RequireUser {
  static global = false

  async handle(c, next) {
    const user = c.get('user')
    if (!user) {
      const session = c.get('session')
      if (session) session.set('_intended', c.req.url)
      return c.redirect('/login')
    }
    if (!(user instanceof User)) {
      const session = c.get('session')
      if (session) session.flash('error', 'This area is for organizer accounts. Sign in with a user account.')
      return c.redirect('/')
    }
    return next()
  }
}

export default RequireUser
