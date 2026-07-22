import App from '../layouts/App.jsx'

export default function Login({ error, email }) {
  return (
    <App title="Sign in">
      <div class="auth-shell">
        <div class="auth-panel">
          <div class="auth-header">
            <div class="auth-mark">◆</div>
            <h1>Welcome back</h1>
            <p class="auth-sub">Sign in to manage your events and tickets.</p>
          </div>

          {error && <div class="flash error">{error}</div>}

          <form action="/login" method="post" class="auth-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" value={email ?? ''} required autofocus placeholder="you@example.com" />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required placeholder="••••••••" />
            </div>
            <button type="submit" class="btn btn-primary btn-lg btn-block">Sign in</button>
          </form>

          <p class="auth-alt">
            New here? <a href="/register">Create an account</a>
          </p>

          <div class="auth-divider"><span>or</span></div>

          <a href="/tickets" class="btn btn-ghost btn-block">Just have tickets? Use the attendee portal →</a>

          <div class="auth-hint">
            <strong>Demo credentials:</strong><br />
            admin@foobar.com &middot; organizer@foobar.com<br />
            <span class="muted">password: <code>aaaaaaaa</code></span>
          </div>
        </div>
      </div>
    </App>
  )
}
