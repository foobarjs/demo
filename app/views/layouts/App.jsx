import { useView } from 'foobarjs/jsx'
import Flash from '../components/Flash.jsx'

export default function App({ title, children }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ? `${title} · Foobar Events` : 'Foobar Events'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/css/app.css" />
      </head>
      <body>
        <Header />
        <main>
          <Flash />
          {children}
        </main>
        <footer class="site-footer">
          <div class="container footer-inner">
            <div>
              <span class="footer-brand">Foobar Events</span>
              <span class="footer-tag">Built with <a href="https://github.com/foobarjs/foobarjs">foobarjs</a></span>
            </div>
            <nav class="footer-nav">
              <a href="/events">Events</a>
              <a href="/tickets">My tickets</a>
              <a href="/api/events">API</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  )
}

function Header() {
  const { user, loggedIn } = useView()
  // The layout doesn't import Attendee/User model classes (JSX pipeline
  // shouldn't touch the ORM). Detect the current identity kind by shape:
  //   - Attendee: no isAdmin / roles fields
  //   - User: has isAdmin, optionally roles
  const kind = _identityKind(user)
  const isAdminUser = kind === 'user' && !!(user?.isAdmin || user?.is_admin)
  const isOrganizer = kind === 'user' && Array.isArray(user?.roles) && user.roles.includes('organizer')
  return (
    <header class="site-header">
      <div class="container header-inner">
        <a href="/" class="logo">
          <span class="logo-mark">◆</span>
          <span>Foobar Events</span>
        </a>
        <nav class="site-nav">
          <a href="/events">Events</a>
          {kind === 'attendee' && <a href="/tickets/my">My tickets</a>}
          {kind !== 'user' && kind !== 'attendee' && <a href="/tickets">My tickets</a>}
          {(isAdminUser || isOrganizer) && <a href="/organizer/dashboard">Dashboard</a>}
          {isAdminUser && <a href="/admin" class="nav-muted">Admin</a>}
          {loggedIn
            ? <form action="/logout" method="post" class="nav-form">
                <button type="submit" class="btn btn-ghost btn-sm">Sign out</button>
              </form>
            : <a href="/login" class="btn btn-primary btn-sm">Sign in</a>
          }
        </nav>
      </div>
    </header>
  )
}

function _identityKind(user) {
  if (!user) return null
  // Duck-typing: an Attendee has `ticketCode` in its schema (email is shared with User).
  // A User has `isAdmin` (nullable but present).
  if ('ticketCode' in user || 'ticket_code' in user) return 'attendee'
  if ('isAdmin' in user || 'is_admin' in user) return 'user'
  return null
}
