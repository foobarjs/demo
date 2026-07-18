import App from '../layouts/App.jsx'
import ProductCard from '../components/ProductCard.jsx'

export default function Home({ categories, featured }) {
  return (
    <App title="Home">
      <section class="hero">
        <h1>Welcome to Foobar Shop</h1>
        <p>A demo storefront built with <strong>foobarjs</strong> — batteries-included Node.js MVC.</p>
        <a href="/products" class="btn btn-primary btn-lg">Browse Products</a>
      </section>

      {categories?.length > 0 && (
        <section class="home-section">
          <h2>Shop by Category</h2>
          <div class="category-grid">
            {categories.map(cat => (
              <a href={`/products?category=${cat.slug}`} class="category-card">
                <h3>{cat.name}</h3>
                <p>{cat.description}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {featured?.length > 0 && (
        <section class="home-section">
          <h2>New Arrivals</h2>
          <div class="product-grid">
            {featured.map(p => <ProductCard product={p} />)}
          </div>
          <div class="section-footer">
            <a href="/products" class="btn">View All Products →</a>
          </div>
        </section>
      )}
    </App>
  )
}
