import App from '../layouts/App.jsx'

export default function PageExpired({ status, message, requestId }) {
  return (
    <App title={`${status || 419} · Page expired`}>
      <div class="error-shell">
        <div class="error-panel">
          <div class="error-code">{status || 419}</div>
          <h1>Your session expired</h1>
          <p class="muted">{message || "Please sign in again to continue where you left off."}</p>
          <div class="error-actions">
            <a href="/login" class="btn btn-primary">Sign in</a>
            <a href="/" class="btn btn-ghost">Back to home</a>
          </div>
          {requestId && <p class="error-request-id">Request ID: <code>{requestId}</code></p>}
        </div>
      </div>
    </App>
  )
}
