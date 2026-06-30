import { apiResource } from '@foobarjs/framework';

/**
 * Customer API resource provides admin read-only access to customer records.
 *
 * Actions:
 *   - index: List all customers (admin only; supports search, filters, sorting).
 *   - show: View a single customer (admin only).
 *
 * Authorization:
 *   - Restricted to admin users via policy (viewAny, view).
 *
 * Use case:
 *   Admin dashboard, order management, CRM integrations, customer support tooling.
 */
export default apiResource('Customer', {
  actions: ['index', 'show'],
  authorize: {
    index: 'viewAny',
    show: 'view',
  },
  search: ['firstName', 'lastName', 'email'],
  sort: ['id', 'firstName', 'lastName', 'email', 'status', 'createdAt'],
  filters: ['status'],
  includes: [],
  withCount: ['orders'],
  pagination: { defaultPerPage: 50, maxPerPage: 200 },
  middleware: ['api'],
  docs: {
    summary: 'Customer records for admin and backoffice integrations (admin only).',
  },
});
