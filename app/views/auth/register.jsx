import App from '../layouts/App.jsx'

export default function Register({ error, name, email }) {
  return (
    <App title="Register">
      <div class="container auth-form">
        <h1>Register</h1>
        {error && <div class="alert alert-error">{error}</div>}
        <form action="/register" method="post">
          <label>Name</label>
          <input type="text" name="name" value={name ?? ''} required />
          <label>Email</label>
          <input type="email" name="email" value={email ?? ''} required />
          <label>Password</label>
          <input type="password" name="password" required />
          <label>Confirm Password</label>
          <input type="password" name="password_confirmation" required />
          <button type="submit" class="btn btn-primary">Register</button>
        </form>
        <p>Already have an account? <a href="/login">Login</a></p>
      </div>
    </App>
  )
}
