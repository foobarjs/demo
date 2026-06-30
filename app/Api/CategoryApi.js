import { apiResource } from '@foobarjs/framework';

/**
 * Category API resource provides read-only access to product categories.
 *
 * Actions:
 *   - index: List all categories (public read; supports search, filters, sorting).
 *   - show: View a single category (public read).
 *
 * Authorization:
 *   - Public reads allowed; no policy required.
 *
 * Use case:
 *   Storefront filtering, category browse UI, integration sync.
 */
export default apiResource('Category', {
  actions: ['index', 'show'],
  search: 'name',
  sort: ['id', 'name', 'slug', 'status'],
  filters: ['status'],
  pagination: { defaultPerPage: 25, maxPerPage: 100 },
  middleware: ['api'],
  docs: {
    summary: 'Product categories for storefront and integrations.',
  },
});
