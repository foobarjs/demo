import App from '../layouts/App.jsx'
import { Num } from 'foobarjs/support'

function formatDateRange(startsAt, endsAt) {
  const s = new Date(startsAt)
  const e = endsAt ? new Date(endsAt) : null
  const day = s.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const start = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const end = e ? e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null
  return { day, start, end }
}

function priceFrom(ticketTypes) {
  if (!ticketTypes?.length) return null
  const prices = ticketTypes.map(t => Number(t.price)).filter(p => !isNaN(p))
  if (!prices.length) return null
  return Math.min(...prices)
}

export default function EventShow({ event, ticketTypes }) {
  const { day, start, end } = formatDateRange(event.startsAt, event.endsAt)
  const from = priceFrom(ticketTypes)
  const totalCapacity = ticketTypes?.reduce((sum, t) => sum + (t.quantity || 0), 0) || 0
  const totalSold = ticketTypes?.reduce((sum, t) => sum + (t.sold || 0), 0) || 0
  const remaining = totalCapacity - totalSold
  const speakers = Array.isArray(event.speakers) ? event.speakers : []
  const schedule = Array.isArray(event.schedule) ? event.schedule : []
  return (
    <App title={event.title}>
      <section class="event-hero">
        <div class="event-hero-bg" aria-hidden="true"></div>
        <div class="container event-hero-inner">
          <div class="event-hero-copy">
            <span class="hero-eyebrow">{event.status === 'published' ? 'Registration open' : event.status}</span>
            <h1>{event.title}</h1>
            <dl class="event-facts">
              <div>
                <dt>Date</dt>
                <dd>{day}<br /><span class="muted">{start}{end ? ` — ${end}` : ''}</span></dd>
              </div>
              {event.venue && (
                <div>
                  <dt>Venue</dt>
                  <dd>{event.venue}<br /><span class="muted">{event.location}</span></dd>
                </div>
              )}
              {from !== null && (
                <div>
                  <dt>Tickets from</dt>
                  <dd>${from.toFixed(2)}<br /><span class="muted">{remaining} left</span></dd>
                </div>
              )}
            </dl>
            <div class="event-hero-cta">
              {ticketTypes?.length > 0 && remaining > 0 ? (
                <a href={`#tickets`} class="btn btn-primary btn-lg">Get tickets</a>
              ) : (
                <span class="btn btn-disabled btn-lg">Sold out</span>
              )}
              <a href="/events" class="btn btn-ghost btn-lg">← All events</a>
            </div>
          </div>
        </div>
      </section>

      <div class="container event-body">
        <div class="event-main">
          {event.description && (
            <section class="event-section">
              <h2>About</h2>
              <p class="prose">{event.description}</p>
            </section>
          )}

          {schedule.length > 0 && (
            <section class="event-section">
              <h2>Schedule</h2>
              <div class="schedule">
                {schedule.map(day => (
                  <div class="schedule-day">
                    <div class="schedule-day-label">{day.day}</div>
                    <ol class="schedule-items">
                      {day.items.map(item => (
                        <li class="schedule-item">
                          <div class="schedule-time">{item.time}</div>
                          <div class="schedule-info">
                            <div class="schedule-title">{item.title}</div>
                            <div class="schedule-meta">
                              {item.speaker && <span>{item.speaker}</span>}
                              {item.speaker && item.room && <span class="dot">·</span>}
                              {item.room && <span class="muted">{item.room}</span>}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </section>
          )}

          {speakers.length > 0 && (
            <section class="event-section">
              <h2>Speakers</h2>
              <div class="speaker-grid">
                {speakers.map(s => (
                  <div class="speaker-card">
                    <div class="speaker-avatar">{s.avatar || s.name?.[0] || '?'}</div>
                    <div class="speaker-info">
                      <div class="speaker-name">{s.name}</div>
                      {s.title && <div class="speaker-title">{s.title}</div>}
                      {s.bio && <p class="speaker-bio">{s.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside class="event-side" id="tickets">
          <div class="ticket-panel">
            <h3>Tickets</h3>
            {ticketTypes?.length > 0 ? (
              <div class="ticket-list">
                {ticketTypes.map(tt => {
                  const available = tt.quantity - tt.sold
                  const soldOut = available <= 0
                  return (
                    <div class={`ticket-row ${soldOut ? 'sold-out' : ''}`}>
                      <div class="ticket-row-head">
                        <div class="ticket-name">{tt.name}</div>
                        <div class="ticket-price">{Num.currency(tt.price)}</div>
                      </div>
                      {tt.description && <p class="ticket-desc">{tt.description}</p>}
                      <div class="ticket-row-foot">
                        <span class="muted">{soldOut ? 'Sold out' : `${available} left`}</span>
                        {!soldOut && (
                          <a href={`/checkout?event=${event.id}&ticket=${tt.id}`} class="btn btn-primary btn-sm">Get</a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p class="muted">No tickets available yet.</p>
            )}
          </div>
        </aside>
      </div>
    </App>
  )
}
