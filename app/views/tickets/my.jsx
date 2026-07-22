import App from '../layouts/App.jsx'

function fmtDate(v, opts) {
  if (!v) return null
  return new Date(v).toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtTime(v) {
  if (!v) return null
  return new Date(v).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// Group tickets by their event so the portal reads like an itinerary.
function groupByEvent(tickets) {
  const byEvent = new Map()
  for (const t of tickets) {
    const ev = t.event instanceof Object ? t.event : null
    const key = ev?.id ?? 'unknown'
    if (!byEvent.has(key)) byEvent.set(key, { event: ev, tickets: [] })
    byEvent.get(key).tickets.push(t)
  }
  // Sort by earliest ticket startsAt within each event, upcoming first.
  const groups = Array.from(byEvent.values())
  groups.sort((a, b) => {
    const at = a.event?.startsAt ? new Date(a.event.startsAt).getTime() : Infinity
    const bt = b.event?.startsAt ? new Date(b.event.startsAt).getTime() : Infinity
    return at - bt
  })
  return groups
}

function TicketRow({ ticket, ownerEmail }) {
  const unassigned = !ticket.name
  const isOwn = !unassigned && (ticket.email === ownerEmail)
  return (
    <div class={`ticket-row ${unassigned ? 'is-unassigned' : ''}`}>
      <div class="ticket-row-main">
        <div class="ticket-row-name">
          {unassigned ? <em class="muted">Unassigned</em> : ticket.name}
          {isOwn && !unassigned && <span class="chip chip-you">you</span>}
        </div>
        <div class="ticket-row-meta muted">
          <code class="ticket-code">{ticket.ticketCode}</code>
          {ticket.checkedInAt
            ? <span class="chip chip-ok">Checked in</span>
            : <span class="chip chip-pending">Not checked in</span>
          }
        </div>
      </div>
      <div class="ticket-row-actions">
        <a href={`/tickets/my/${ticket.id}/edit`} class="btn btn-ghost btn-sm">
          {unassigned ? 'Assign →' : 'Rename'}
        </a>
      </div>
    </div>
  )
}

function EventCard({ event, tickets, ownerEmail, ownedOrderIds }) {
  const day = event ? fmtDate(event.startsAt, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : null
  const time = event ? fmtTime(event.startsAt) : null
  const unassignedCount = tickets.filter(t => !t.name).length
  // "Owned by you" vs "Received from someone else"
  const anyOwned = tickets.some(t => ownedOrderIds.has(t.order))
  const allFromOthers = !anyOwned
  return (
    <article class="event-card portal-event">
      <div class="portal-event-head">
        <div>
          <h3>{event?.title || 'Event'}</h3>
          {day && (
            <p class="portal-event-when muted">
              {day}{time ? ` · ${time}` : ''}
              {event?.venue ? ` · ${event.venue}` : ''}
            </p>
          )}
        </div>
        <div class="portal-event-badges">
          {allFromOthers && <span class="chip chip-gift" title="A ticket was reassigned to you.">Received</span>}
          {unassignedCount > 0 && (
            <span class="chip chip-warn">{unassignedCount} unassigned</span>
          )}
        </div>
      </div>
      <div class="ticket-rows">
        {tickets.map(t => <TicketRow ticket={t} ownerEmail={ownerEmail} />)}
      </div>
    </article>
  )
}

function OrdersRow({ orders }) {
  if (!orders?.length) return null
  return (
    <section class="portal-orders">
      <div class="section-header">
        <h2>Your orders</h2>
      </div>
      <div class="portal-order-list">
        {orders.map(o => {
          const event = o.event instanceof Object ? o.event : null
          const when = event ? fmtDate(event.startsAt) : null
          return (
            <div class="portal-order">
              <div class="portal-order-num">
                <code>{o.orderNumber}</code>
                <span class={`chip chip-${o.paymentStatus === 'paid' ? 'ok' : 'warn'}`}>
                  {o.paymentStatus}
                </span>
              </div>
              <div class="portal-order-body">
                <div class="portal-order-title">{event?.title || 'Event'}</div>
                <div class="muted portal-order-meta">
                  {when ? `${when} · ` : ''}${Number(o.total).toFixed(2)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function MyTickets({ email, tickets, orders }) {
  const groups = groupByEvent(tickets)
  const ownedOrderIds = new Set((orders || []).map(o => o.id))
  const unassignedTotal = tickets.filter(t => !t.name).length
  return (
    <App title="My tickets">
      <section class="page-hero">
        <div class="container">
          <span class="hero-eyebrow">Attendee portal</span>
          <h1>Your tickets</h1>
          <p class="page-hero-lede">
            Signed in as <strong>{email}</strong> · {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
            {unassignedTotal > 0 && (
              <> · <strong>{unassignedTotal} still need a name</strong></>
            )}
          </p>
        </div>
      </section>

      <section class="container section">
        <OrdersRow orders={orders} />

        {groups.length === 0 ? (
          <div class="empty">
            <p>No tickets found for this email.</p>
            <a href="/events" class="btn btn-primary" style="margin-top: 1rem;">Browse events</a>
          </div>
        ) : (
          <div class="portal-events">
            <div class="section-header">
              <h2>Your events</h2>
            </div>
            {groups.map(g => (
              <EventCard
                event={g.event}
                tickets={g.tickets}
                ownerEmail={email}
                ownedOrderIds={ownedOrderIds}
              />
            ))}
          </div>
        )}
      </section>
    </App>
  )
}
