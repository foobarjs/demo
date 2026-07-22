import App from '../layouts/App.jsx'

export default function NotFound({ status, message, requestId }) {
  return (
    <App title={`${status || 404} · Not found`}>
      <div class="error-shell">
        <div class="error-panel">
          <div class="error-code">{status || 404}</div>
          <h1>We can't find that page</h1>
          <p class="muted">{message || "The link may have expired, or the event might have been unpublished."}</p>
          <div class="error-actions">
            <a href="/" class="btn btn-primary">Back to home</a>
            <a href="/events" class="btn btn-ghost">Browse events</a>
          </div>
          {requestId && <p class="error-request-id">Request ID: <code>{requestId}</code></p>}
        </div>
      </div>
    </App>
  )
}
