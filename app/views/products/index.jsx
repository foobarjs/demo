import App from '../layouts/App.jsx'
import ProductCard from '../components/ProductCard.jsx'

export default function Products({ products, categories, activeCategory }) {
  return (
    <App title="Products">
      <div class="container">
        <h1>Products</h1>

        {categories?.length > 0 && (
          <div class="categories">
            <a href="/products" class={`chip ${!activeCategory ? 'active' : ''}`}>All</a>
            {categories.map(cat => (
              <a
                href={`/products?category=${cat.slug}`}
                class={`chip ${activeCategory?.id === cat.id ? 'active' : ''}`}
              >
                {cat.name}
              </a>
            ))}
          </div>
        )}

        {products?.length > 0 ? (
          <div class="product-grid">
            {products.map(p => <ProductCard product={p} />)}
          </div>
        ) : (
          <div class="empty">
            <p>No products found.</p>
            {activeCategory && <a href="/products" class="btn">Clear Filter</a>}
          </div>
        )}
      </div>
    </App>
  )
}
