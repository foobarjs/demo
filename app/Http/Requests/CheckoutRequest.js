import { field, request } from '@foobarjs/framework';

/**
 * Checkout request validation.
 *
 * Validates both format and business logic:
 * - Email: must be valid and unique per customer (or reuse existing).
 * - Product: must exist and be available for purchase.
 * - Quantity: must not exceed available inventory or request limit.
 *
 * The service layer will perform inventory-aware transaction checks
 * before committing the order.
 */
export default request('CheckoutRequest', {
  email: field.string().required().email().max(255),
  productId: field.integer().required().min(1),
  quantity: field.integer().required().min(1).max(10),
}, {
  // Custom validation rules run after field rules pass.
  async rules(ctx) {
    const products = ctx.model('Product');
    const product = products.find(ctx.validated.productId);

    if (!product) {
      ctx.error('productId', 'Product not found or unavailable.');
      return;
    }

    if (product.status !== 'active') {
      ctx.error('productId', 'Product is not available for purchase.');
      return;
    }

    const quantity = Number(ctx.validated.quantity || 1);
    if (quantity > Number(product.inventory || 0)) {
      ctx.error(
        'quantity',
        `Only ${product.inventory} in stock. Please reduce quantity.`,
      );
    }
  },
});

