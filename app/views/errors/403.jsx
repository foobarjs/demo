import App from '../layouts/App.jsx'

export default function Forbidden({ message, requestId }) {
  return (
    <App title="403 - Forbidden">
      <div class="container error-page" style="text-align:center; padding: 60px 20px;">
        <h1 style="font-size: 48px; color:#dc2626; margin:0;">403</h1>
        <h2 style="margin: 12px 0;">Forbidden</h2>
        <p style="color:#64748b;">{message || "You don't have permission to access this page."}</p>
        <p><a href="/" class="btn btn-primary">Go back home</a></p>
        {requestId && (
          <p style="margin-top: 40px; font-size: 12px; color:#94a3b8; font-family: monospace;">Request ID: {requestId}</p>
        )}
      </div>
    </App>
  )
}
