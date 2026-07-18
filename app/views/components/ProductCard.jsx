export default function ProductCard({ product }) {
  return (
    <a href={`/products/${product.id}`} class="card">
      <div class="card-image">{product.name.charAt(0)}</div>
      <h3>{product.name}</h3>
      <p class="price">${parseFloat(product.price).toFixed(2)}</p>
      {product.stock > 0
        ? <p class="stock">{product.stock} in stock</p>
        : <p class="stock out">Out of stock</p>
      }
    </a>
  )
}
