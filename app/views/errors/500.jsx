import App from '../layouts/App.jsx'

export default function ServerError({ status, message, requestId }) {
  return (
    <App title={`${status || 500} · Server error`}>
      <div class="error-shell">
        <div class="error-panel">
          <div class="error-code">{status || 500}</div>
          <h1>Something went wrong</h1>
          <p class="muted">{message || "We hit an unexpected error. The team has been notified — please try again in a moment."}</p>
          <div class="error-actions">
            <a href="/" class="btn btn-primary">Back to home</a>
          </div>
          {requestId && <p class="error-request-id">Request ID: <code>{requestId}</code></p>}
        </div>
      </div>
    </App>
  )
}
