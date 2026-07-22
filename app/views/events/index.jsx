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
          {event.description && <p class="event-card-desc">{event.description.slice(0, 130)}{event.description.length > 130 ? '…' : ''}</p>}
        </div>
      </div>
    </a>
  )
}

export default function EventsIndex({ events }) {
  const items = events?.data || events || []
  const meta = events?.meta
  return (
    <App title="Events">
      <section class="page-hero">
        <div class="container">
          <span class="hero-eyebrow">All events</span>
          <h1>Find your next gathering</h1>
          <p class="page-hero-lede">Conferences, meetups, workshops — filtered by what's still open.</p>
        </div>
      </section>

      <section class="container section">
        {items.length > 0 ? (
          <div class="event-grid">
            {items.map(event => <EventCard event={event} />)}
          </div>
        ) : (
          <div class="empty">
            <p>No events found.</p>
          </div>
        )}

        {meta && meta.lastPage > 1 && (
          <nav class="pagination">
            {meta.currentPage > 1 && <a href={`/events?page=${meta.currentPage - 1}`} class="btn btn-ghost">← Previous</a>}
            <span class="pagination-meta">Page {meta.currentPage} of {meta.lastPage}</span>
            {meta.currentPage < meta.lastPage && <a href={`/events?page=${meta.currentPage + 1}`} class="btn btn-ghost">Next →</a>}
          </nav>
        )}
      </section>
    </App>
  )
}
