import App from '../layouts/App.jsx'

export default function Checkout({ cart }) {
  return (
    <App title="Checkout">
      <div class="container">
        <h1>Checkout</h1>

        {!cart?.length ? (
          <div class="empty">
            <p>Your cart is empty.</p>
            <a href="/products" class="btn btn-primary">Browse Products</a>
          </div>
        ) : (
          <div class="checkout-layout">
            <div class="checkout-form">
              <h2>Shipping Details</h2>
              <form action="/checkout" method="post">
                <label for="name">Full Name</label>
                <input type="text" id="name" name="name" required />

                <label for="email">Email</label>
                <input type="email" id="email" name="email" required />

                <label for="address">Shipping Address</label>
                <textarea id="address" name="address" rows="3" required></textarea>

                <button type="submit" class="btn btn-primary btn-lg">Place Order</button>
              </form>
            </div>

            <div class="order-summary">
              <h2>Order Summary</h2>
              {cart.map(item => (
                <div class="summary-item">
                  <span>{item.name} &times; {item.quantity}</span>
                  <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div class="summary-total">
                <strong>Total</strong>
                <strong>${cart.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </App>
  )
}
