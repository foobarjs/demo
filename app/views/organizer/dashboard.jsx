import App from '../layouts/App.jsx'
import { useView } from 'foobarjs/jsx'
import { Num } from 'foobarjs/support'

function Stat({ label, value, hint, icon }) {
  return (
    <div class="stat-card">
      <div class="stat-icon">{icon}</div>
      <div class="stat-value">{value}</div>
      <div class="stat-label">{label}</div>
      {hint && <div class="stat-hint">{hint}</div>}
    </div>
  )
}

export default function Dashboard({ events, totalRevenue, totalAttendees }) {
  const { user } = useView()
  const upcoming = (events || []).filter(e => e.status === 'published').length
  const drafts = (events || []).filter(e => e.status === 'draft').length
  return (
    <App title="Dashboard">
      <section class="page-hero">
        <div class="container">
          <span class="hero-eyebrow">Organizer</span>
          <h1>Hello, {user?.name?.split(' ')[0] || 'there'}.</h1>
          <p class="page-hero-lede">Here's what's happening across your events.</p>
        </div>
      </section>

      <section class="container section">
        <div class="stats-grid">
          <Stat label="Total events" value={events?.length || 0} hint={`${upcoming} published, ${drafts} draft`} icon="◆" />
          <Stat label="Revenue" value={Num.currency(totalRevenue || 0)} hint="all confirmed orders" icon="◇" />
          <Stat label="Attendees" value={totalAttendees || 0} hint="across all events" icon="◈" />
        </div>

        <div class="section-header" style="margin-top: 2.5rem;">
          <h2>Your events</h2>
          <div class="dashboard-actions">
            <a href="/organizer/events/new" class="btn btn-primary btn-sm">+ New event</a>
            <a href="/organizer/events" class="btn btn-ghost btn-sm">Manage all →</a>
          </div>
        </div>

        {events?.length > 0 ? (
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th class="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr>
                    <td>
                      <a href={`/events/${event.slug || event.id}`} class="row-primary">{event.title}</a>
                      {event.venue && <div class="row-sub">{event.venue}</div>}
                    </td>
                    <td>{new Date(event.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td><span class={`badge badge-${event.status}`}>{event.status}</span></td>
                    <td class="th-actions">
                      <a href={`/organizer/events/${event.id}/edit`} class="btn btn-ghost btn-sm">Edit</a>
                      <a href={`/organizer/dashboard/export-attendees?event=${event.id}`} class="btn btn-ghost btn-sm">Export</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div class="empty">
            <p>You haven't created any events yet.</p>
            <a href="/organizer/events/new" class="btn btn-primary" style="margin-top: 1rem;">Create your first event</a>
          </div>
        )}
      </section>
    </App>
  )
}
