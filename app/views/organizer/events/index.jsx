import App from '../../layouts/App.jsx'

export default function OrganizerEvents({ events }) {
  return (
    <App title="My Events">
      <section class="page-hero">
        <div class="container">
          <span class="hero-eyebrow">Organizer</span>
          <div class="page-hero-row">
            <h1>My events</h1>
            <a href="/organizer/events/new" class="btn btn-primary">+ New event</a>
          </div>
        </div>
      </section>

      <section class="container section">
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
