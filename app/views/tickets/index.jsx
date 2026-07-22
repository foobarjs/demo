import App from '../layouts/App.jsx'
import { useView } from 'foobarjs/jsx'

export default function TicketsIndex({ sent }) {
  const { errors, old } = useView()
  return (
    <App title="My tickets">
      <div class="auth-shell">
        <div class="auth-panel">
          <div class="auth-header">
            <div class="auth-mark">◈</div>
            <h1>Attendee portal</h1>
            <p class="auth-sub">Enter the email on your ticket. We'll send you a sign-in link.</p>
          </div>

          {sent ? (
            <div class="sent-panel">
              <div class="sent-check">✓</div>
              <h2>Check your inbox</h2>
              <p>If a ticket exists for <strong>{sent}</strong>, we've sent a sign-in link. It expires in 30 minutes.</p>
              <a href="/tickets" class="btn btn-ghost btn-block">Use a different email</a>
            </div>
          ) : (
            <form action="/tickets/send" method="post" class="auth-form">
              <div class="form-group">
                <label for="email">Email on your ticket</label>
                <input type="email" id="email" name="email" required autofocus placeholder="you@example.com" value={old('email') || ''} class={errors?.email ? 'is-invalid' : ''} />
                {errors?.email && <div class="invalid-feedback">{errors.email[0]}</div>}
              </div>
              <button type="submit" class="btn btn-primary btn-lg btn-block">Send me a link</button>
            </form>
          )}

          <div class="auth-hint">
            <strong>Try it:</strong> use <code>alice@example.com</code> — seeded with a Tech Conference 2026 ticket.
          </div>
        </div>
      </div>
    </App>
  )
}
