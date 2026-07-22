import App from '../layouts/App.jsx'
import { useView } from 'foobarjs/jsx'
import { Num } from 'foobarjs/support'

export default function Checkout({ event, ticketTypes }) {
  const { errors, old } = useView()
  const selectedTicket = ticketTypes?.[0]
  const startsAt = event.startsAt ? new Date(event.startsAt) : null
  return (
    <App title={`Checkout — ${event.title}`}>
      <div class="checkout-shell">
        <div class="checkout-panel">
          <a href={`/events/${event.slug || event.id}`} class="back-link">← Back to event</a>

          <div class="checkout-head">
            <span class="hero-eyebrow">Get tickets</span>
            <h1>{event.title}</h1>
            {startsAt && (
              <p class="muted">
                {startsAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                {event.venue ? ` · ${event.venue}` : ''}
              </p>
            )}
          </div>

          <form method="POST" action="/checkout" class="checkout-form">
            <input type="hidden" name="event_id" value={event.id} />

            <div class="form-group">
              <label for="ticket_type_id">Ticket type</label>
              <select name="ticket_type_id" id="ticket_type_id" class={errors?.ticket_type_id ? 'is-invalid' : ''}>
                {ticketTypes.map(tt => (
                  <option value={tt.id} selected={old('ticket_type_id') == tt.id || tt.id === selectedTicket?.id}>
                    {tt.name} — {Num.currency(tt.price)} · {tt.quantity - tt.sold} left
                  </option>
                ))}
              </select>
              {errors?.ticket_type_id && <div class="invalid-feedback">{errors.ticket_type_id[0]}</div>}
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="quantity">Quantity</label>
                <input type="number" name="quantity" id="quantity" min="1" max="10" value={old('quantity') || '1'} class={errors?.quantity ? 'is-invalid' : ''} />
                {errors?.quantity && <div class="invalid-feedback">{errors.quantity[0]}</div>}
              </div>
              <div class="form-group">
                <label for="discount_code">Discount code <span class="muted">(optional)</span></label>
                <input type="text" name="discount_code" id="discount_code" value={old('discount_code') || ''} placeholder="EARLY20" />
              </div>
            </div>

            <div class="fieldset-heading">Your details</div>
            <p class="muted" style="font-size: 0.85rem; margin-top: -0.25rem; margin-bottom: 0.75rem;">
              Tickets go to this email. You can reassign them later from the attendee portal.
            </p>

            <div class="form-group">
              <label for="name">Full name</label>
              <input type="text" name="name" id="name" value={old('name') || ''} required class={errors?.name ? 'is-invalid' : ''} />
              {errors?.name && <div class="invalid-feedback">{errors.name[0]}</div>}
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" name="email" id="email" value={old('email') || ''} required class={errors?.email ? 'is-invalid' : ''} />
              {errors?.email && <div class="invalid-feedback">{errors.email[0]}</div>}
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-block">Complete purchase</button>
            <p class="muted" style="font-size: 0.8rem; text-align: center; margin-top: 0.85rem;">
              This is a demo — no real payment is charged.
            </p>
          </form>
        </div>
      </div>
    </App>
  )
}
