import { policy } from '@foobarjs/framework';

/**
 * Customer policy defines authorization rules for customer API/admin access.
 *
 * Rules:
 *   - viewAny/view: Admin only (role === 'admin').
 *
 * Rationale:
 *   Customer records contain PII (email, names, order history via relations).
 *   Access restricted to admin users for CRM and support workflows.
 */
export default policy('Customer', {
  viewAny: ({ user }) => user?.role === 'admin',
  view: ({ user }) => user?.role === 'admin',
});
