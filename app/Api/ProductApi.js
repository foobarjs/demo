import { apiResource } from '@foobarjs/framework';

export default apiResource('Product', {
  search: 'name',
  filters: ['status', 'categoryId'],
  sort: ['id', 'name', 'price', 'inventory', 'status'],
  includes: ['category'],
  withCount: ['orderItems'],
  pagination: { defaultPerPage: 25, maxPerPage: 50 },
  actions: ['index', 'show', 'store', 'update', 'destroy'],
  requests: {
    store: 'StoreProductRequest',
    update: 'UpdateProductRequest',
  },
  authorize: false,
  middleware: ['api'],
  docs: {
    summary: 'Products available in the storefront catalog.',
  },
});
