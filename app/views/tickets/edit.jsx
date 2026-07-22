import App from '../layouts/App.jsx'
import { useView } from 'foobarjs/jsx'

export default function EditTicket({ ticket }) {
  const { errors, old } = useView()
  const event = ticket.event instanceof Object ? ticket.event : null
  const tt = ticket.ticketType instanceof Object ? ticket.ticketType : null
  const wasUnassigned = !ticket.name
  return (
    <App title={wasUnassigned ? 'Assign ticket' : 'Rename ticket'}>
      <div class="form-page">
        <a href="/tickets/my" class="back-link">← Back to my tickets</a>
        <h1>{wasUnassigned ? 'Assign this ticket' : 'Update attendee name'}</h1>
        {event && <p class="muted" style="margin-bottom: 1.5rem;">{event.title}{tt ? ` · ${tt.name}` : ''}</p>}

        <div class="callout">
          <strong>Name only.</strong> The email on this ticket is locked to your signed-in
          address. To transfer to a different person, ask the organizer.
        </div>

        <form action={`/tickets/my/${ticket.id}`} method="post">
          <div class="form-group">
            <label for="name">Attendee name</label>
            <input type="text" id="name" name="name" required autofocus
              placeholder="e.g. Alex Rivera"
              value={old('name') || ticket.name || ''}
              class={errors?.name ? 'is-invalid' : ''} />
            {errors?.name && <div class="invalid-feedback">{errors.name[0]}</div>}
          </div>

          <div class="form-group">
            <label>Email</label>
            <input type="email" value={ticket.email} disabled />
            <div class="muted" style="font-size: 0.8rem; margin-top: 0.35rem;">
              Locked to your signed-in email.
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              {wasUnassigned ? 'Assign ticket' : 'Save changes'}
            </button>
            <a href="/tickets/my" class="btn btn-ghost">Cancel</a>
          </div>
        </form>
      </div>
    </App>
  )
}
