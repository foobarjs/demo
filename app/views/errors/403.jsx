import App from '../layouts/App.jsx'

export default function Forbidden({ status, message, requestId }) {
  return (
    <App title={`${status || 403} · Forbidden`}>
      <div class="error-shell">
        <div class="error-panel">
          <div class="error-code">{status || 403}</div>
          <h1>You don't have access to this</h1>
          <p class="muted">{message || "This action is restricted. Sign in with an account that has permission."}</p>
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
