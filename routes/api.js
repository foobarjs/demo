export default function routes(route) {
  // CORS preflight options for API endpoints
  route.options('/api/products', () => null).name('api.products.options');
  route.options('/api/orders', () => null).name('api.orders.options');
  route.options('/api/categories', () => null).name('api.categories.options');
  route.options('/api/customers', () => null).name('api.customers.options');
}
