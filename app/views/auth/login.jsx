import App from '../layouts/App.jsx'

export default function Login({ error, email }) {
  return (
    <App title="Login">
      <div class="container auth-form">
        <h1>Login</h1>
        {error && <div class="alert alert-error">{error}</div>}
        <form action="/login" method="post">
          <label>Email</label>
          <input type="email" name="email" value={email ?? ''} required />
          <label>Password</label>
          <input type="password" name="password" required />
          <button type="submit" class="btn btn-primary">Login</button>
        </form>
        <p>Don't have an account? <a href="/register">Register</a></p>
      </div>
    </App>
  )
}
