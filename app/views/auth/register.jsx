import App from '../layouts/App.jsx'

export default function Register({ error, name, email }) {
  return (
    <App title="Create account">
      <div class="auth-shell">
        <div class="auth-panel">
          <div class="auth-header">
            <div class="auth-mark">◆</div>
            <h1>Create your account</h1>
            <p class="auth-sub">Sign up to attend events or start hosting your own.</p>
          </div>

          {error && <div class="flash error">{error}</div>}

          <form action="/register" method="post" class="auth-form">
            <div class="form-group">
              <label for="name">Full name</label>
              <input type="text" id="name" name="name" value={name ?? ''} required autofocus />
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" value={email ?? ''} required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required />
              </div>
              <div class="form-group">
                <label for="password_confirmation">Confirm</label>
                <input type="password" id="password_confirmation" name="password_confirmation" required />
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-lg btn-block">Create account</button>
          </form>

          <p class="auth-alt">
            Already have an account? <a href="/login">Sign in</a>
          </p>
        </div>
      </div>
    </App>
  )
}
