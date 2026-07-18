import { useView } from 'foobarjs/jsx'
import Flash from '../components/Flash.jsx'

export default function App({ title, children }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ? `${title} - Foobar Shop` : 'Foobar Shop'}</title>
        <link rel="stylesheet" href="/css/app.css" />
      </head>
      <body>
        <Header />
        <main>
          <Flash />
          {children}
        </main>
        <footer>
          <p>Built with <a href="https://github.com/foobarjs/foobarjs">foobarjs</a></p>
        </footer>
      </body>
    </html>
  )
}

function Header() {
  const { user, loggedIn, cartCount } = useView()
  return (
    <header>
      <div class="header-inner">
        <a href="/" class="logo">Foobar Shop</a>
        <nav>
          <a href="/">Home</a>
          <a href="/products">Products</a>
          <a href="/cart">Cart ({cartCount})</a>
          {loggedIn
            ? <form action="/logout" method="post" class="nav-form">
                <button type="submit">Logout</button>
              </form>
            : <a href="/login">Login</a>
          }
          <a href="/admin" class="nav-admin">Admin</a>
        </nav>
      </div>
    </header>
  )
}
