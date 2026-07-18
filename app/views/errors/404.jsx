import App from '../layouts/App.jsx'

export default function NotFound({ status, message, requestId }) {
  return (
    <App title={`${status || 404} - Page Not Found`}>
      <div class="container error-page" style="text-align:center; padding: 60px 20px;">
        <h1 style="font-size: 48px; color:#dc2626; margin:0;">{status || 404}</h1>
        <h2 style="margin: 12px 0;">Page Not Found</h2>
        <p style="color:#64748b;">{message || "Sorry, we couldn't find the page you were looking for."}</p>
        <p><a href="/" class="btn btn-primary">Go back home</a></p>
        {requestId && (
          <p style="margin-top: 40px; font-size: 12px; color:#94a3b8; font-family: monospace;">Request ID: {requestId}</p>
        )}
      </div>
    </App>
  )
}
