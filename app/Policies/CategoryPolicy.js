import { policy } from '@foobarjs/framework';

/**
 * Category policy defines authorization rules for category API/admin access.
 *
 * Rules:
 *   - viewAny/view: Public reads allowed (no role check).
 *
 * Rationale:
 *   Categories are storefront data; public read access is intentional and safe.
 */
export default policy('Category', {
  viewAny: () => true,
  view: () => true,
});
