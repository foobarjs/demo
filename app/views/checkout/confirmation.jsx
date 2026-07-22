import App from '../layouts/App.jsx'
import { Num } from 'foobarjs/support'

export default function Confirmation({ order, attendees, event, ticketType }) {
  const startsAt = event.startsAt ? new Date(event.startsAt) : null
  return (
    <App title="Order confirmed">
      <div class="confirmation-shell">
        <div class="confirmation-panel">
          <div class="confirmation-check">✓</div>
          <div class="confirmation-head">
            <span class="hero-eyebrow">Confirmed</span>
            <h1>You're going to {event.title}</h1>
            <p class="muted">Order <code>{order.orderNumber}</code> · confirmation sent to {order.email}</p>
          </div>

          <dl class="event-facts confirmation-facts">
            {startsAt && (
              <div>
                <dt>Date</dt>
                <dd>{startsAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}<br />
                  <span class="muted">{startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                </dd>
              </div>
            )}
            {event.venue && (
              <div>
                <dt>Venue</dt>
                <dd>{event.venue}<br /><span class="muted">{event.location}</span></dd>
              </div>
            )}
            <div>
              <dt>Total</dt>
              <dd>{Num.currency(order.total)}<br />
                {order.discount > 0 && <span class="muted">saved {Num.currency(order.discount)}</span>}
              </dd>
            </div>
          </dl>

          <div class="tickets-list">
            <div class="tickets-heading">
              <h2>{attendees.length} {attendees.length === 1 ? 'ticket' : 'tickets'} · {ticketType.name}</h2>
              {attendees.length > 1
                ? <p class="muted">The first ticket is yours. Assign the remaining tickets to attendees from your portal.</p>
                : <p class="muted">Present the code at the door, or update details from the portal.</p>
              }
            </div>
            {attendees.map((a, i) => (
              <div class={`ticket-stub ${a.name ? '' : 'is-unassigned'}`}>
                <div class="ticket-stub-perf">TICKET {String(i + 1).padStart(2, '0')}</div>
                <div class="ticket-stub-body">
                  <div class="ticket-stub-name">
                    {a.name || <em class="muted">Unassigned — assign in portal</em>}
                  </div>
                  <div class="ticket-stub-email muted">{a.email}</div>
                </div>
                <div class="ticket-stub-code"><code>{a.ticketCode}</code></div>
              </div>
            ))}
          </div>

          <div class="confirmation-cta">
            <a href="/tickets" class="btn btn-primary btn-lg">Manage tickets →</a>
            <a href="/events" class="btn btn-ghost btn-lg">Browse more events</a>
          </div>
        </div>
      </div>
    </App>
  )
}
