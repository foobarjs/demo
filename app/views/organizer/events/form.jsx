import App from '../../layouts/App.jsx'
import { useView } from 'foobarjs/jsx'

function toLocalInput(v) {
  if (!v) return ''
  const d = v instanceof Date ? v : new Date(v)
  if (isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EventForm({ event }) {
  const { errors, old } = useView()
  const isEdit = !!event
  const action = isEdit ? `/organizer/events/${event.id}` : '/organizer/events'
  return (
    <App title={isEdit ? `Edit: ${event.title}` : 'Create Event'}>
      <section class="form-page">
        <h1>{isEdit ? 'Edit Event' : 'Create Event'}</h1>

        <form method="POST" action={action}>
          {isEdit && <input type="hidden" name="_method" value="PUT" />}

          <div class="form-group">
            <label for="title">Title</label>
            <input type="text" name="title" id="title" value={old('title') || event?.title || ''} required class={errors?.title ? 'is-invalid' : ''} />
            {errors?.title && <div class="invalid-feedback">{errors.title[0]}</div>}
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea name="description" id="description" rows="4" class={errors?.description ? 'is-invalid' : ''}>{old('description') || event?.description || ''}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="startsAt">Start Date & Time</label>
              <input type="datetime-local" name="startsAt" id="startsAt" value={old('startsAt') || toLocalInput(event?.startsAt)} required />
            </div>
            <div class="form-group">
              <label for="endsAt">End Date & Time</label>
              <input type="datetime-local" name="endsAt" id="endsAt" value={old('endsAt') || toLocalInput(event?.endsAt)} />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="venue">Venue</label>
              <input type="text" name="venue" id="venue" value={old('venue') || event?.venue || ''} placeholder="e.g. Convention Center" />
            </div>
            <div class="form-group">
              <label for="location">Location</label>
              <input type="text" name="location" id="location" value={old('location') || event?.location || ''} placeholder="e.g. San Francisco, CA" />
            </div>
          </div>

          {isEdit && (
            <div class="form-group">
              <label for="status">Status</label>
              <select name="status" id="status">
                {['draft', 'published', 'cancelled', 'completed'].map(s => (
                  <option value={s} selected={event?.status === s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          )}

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">{isEdit ? 'Update Event' : 'Create Event'}</button>
            <a href="/organizer/events" class="btn">Cancel</a>
          </div>
        </form>
      </section>
    </App>
  )
}
