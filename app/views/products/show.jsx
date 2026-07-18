import App from '../layouts/App.jsx'
import ProductCard from '../components/ProductCard.jsx'

export default function ProductShow({ product, related }) {
  return (
    <App title={product.name}>
      <div class="container">
        <a href="/products" class="back-link">&larr; Back to products</a>

        <div class="product-layout">
          <div class="product-image">{product.name.charAt(0)}</div>
          <div class="product-info">
            <h1>{product.name}</h1>
            <p class="price price-lg">${parseFloat(product.price).toFixed(2)}</p>

            {product.stock > 0
              ? <p class="stock">{product.stock} in stock</p>
              : <p class="stock out">Out of stock</p>}

            {product.description && <p class="description">{product.description}</p>}

            {product.stock > 0 && (
              <form action="/cart" method="post" class="add-to-cart">
                <input type="hidden" name="product_id" value={product.id} />
                <label for="qty">Qty</label>
                <input type="number" id="qty" name="quantity" value="1" min="1" max={product.stock} />
                <button type="submit" class="btn btn-primary">Add to Cart</button>
              </form>
            )}

            {product.category && typeof product.category === 'object' && (
              <p class="meta">
                Category: <a href={`/products?category=${product.category.slug}`}>{product.category.name}</a>
              </p>
            )}

            {product.tags?.length > 0 && (
              <div class="tags">
                {product.tags.map(tag => <span class="tag">{tag.name}</span>)}
              </div>
            )}
          </div>
        </div>

        {related?.length > 0 && (
          <section class="home-section">
            <h2>Related Products</h2>
            <div class="product-grid">
              {related.map(item => <ProductCard product={item} />)}
            </div>
          </section>
        )}
      </div>
    </App>
  )
}
