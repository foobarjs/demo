import App from '../layouts/App.jsx'

function EventCard({ event }) {
  const d = new Date(event.startsAt)
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const day = d.getDate()
  return (
    <a href={`/events/${event.slug || event.id}`} class="event-card">
      <div class="event-card-cover">
        <span class="event-card-badge">{event.status}</span>
      </div>
      <div class="event-card-body">
        <div class="event-card-date">
          <span class="date-month">{month}</span>
          <span class="date-day">{day}</span>
        </div>
        <div class="event-card-content">
          <h3>{event.title}</h3>
          {event.venue && <p class="event-card-meta">{event.venue}{event.location ? ` · ${event.location}` : ''}</p>}
          {event.description && <p class="event-card-desc">{event.description.slice(0, 110)}{event.description.length > 110 ? '…' : ''}</p>}
        </div>
      </div>
    </a>
  )
}

export default function Home({ events }) {
  const items = events?.data || events || []
  return (
    <App title="Discover Events">
      <section class="hero">
        <div class="container hero-inner">
          <span class="hero-eyebrow">Foobar Events · 2026 season</span>
          <h1 class="hero-title">
            Everything great starts with a room full of the right people.
          </h1>
          <p class="hero-lede">
            Browse curated conferences, meetups and workshops. Get tickets in one flow, check in with a QR code, and skip the spreadsheets.
          </p>
          <div class="hero-cta">
            <a href="/events" class="btn btn-primary btn-lg">Browse events</a>
            <a href="/organizer/dashboard" class="btn btn-ghost btn-lg">For organizers →</a>
          </div>
        </div>
        <div class="hero-orb" aria-hidden="true"></div>
        <div class="hero-orb hero-orb-2" aria-hidden="true"></div>
      </section>

      <section class="container section">
        <div class="section-header">
          <h2>Upcoming events</h2>
          <a href="/events" class="section-link">See all →</a>
        </div>
        {items.length > 0 ? (
          <div class="event-grid">
            {items.slice(0, 6).map(event => <EventCard event={event} />)}
          </div>
        ) : (
          <div class="empty">
            <p>No upcoming events yet — check back soon.</p>
          </div>
        )}
      </section>

      <section class="container section feature-strip">
        <div class="feature">
          <div class="feature-icon">◇</div>
          <h4>Instant tickets</h4>
          <p>Paperless registration with per-attendee QR codes and confirmation email in one transaction.</p>
        </div>
        <div class="feature">
          <div class="feature-icon">◈</div>
          <h4>Organizer dashboard</h4>
          <p>Bring your own events. Track sales, export attendees, and check people in from any device.</p>
        </div>
        <div class="feature">
          <div class="feature-icon">◆</div>
          <h4>Open API</h4>
          <p>Every public event is available at <code>/api/events</code> — build widgets and integrations freely.</p>
        </div>
      </section>
    </App>
  )
}
