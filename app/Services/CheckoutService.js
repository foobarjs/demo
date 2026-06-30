import { service, FrameworkError } from '@foobarjs/framework';

function orderNumber() {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Checkout service handles order creation with inventory-aware transactions.
 *
 * Guarantees:
 * - Orders only created if inventory is sufficient (rechecked at transaction time).
 * - Order totals are deterministic and traceable.
 * - Inventory is atomically decremented alongside order creation.
 * - Events are dispatched after successful commit.
 *
 * Failure modes:
 * - Insufficient inventory: thrown during transaction (caught and reported by controller).
 * - Product not found or inactive: should be caught by request validation.
 * - Email parsing failures: handled gracefully with customer.firstOrCreate.
 */
export default service('CheckoutService', {
  async checkout(ctx, data) {
    const products = ctx.model('Product');
    const customers = ctx.model('Customer');
    const orders = ctx.model('Order');
    const orderItems = ctx.model('OrderItem');

    // Re-validate product availability at checkout time (request layer has already checked).
    const product = products.find(data.productId);
    if (!product || product.status !== 'active') {
      throw new FrameworkError('Product is not available.', {
        status: 422,
        code: 'PRODUCT_UNAVAILABLE',
        hint: 'The product may have been removed or deactivated.',
      });
    }

    const quantity = Number(data.quantity || 1);
    const availableInventory = Number(product.inventory || 0);

    if (quantity > availableInventory) {
      throw new FrameworkError('Insufficient inventory.', {
        status: 422,
        code: 'INSUFFICIENT_INVENTORY',
        hint: `Only ${availableInventory} available. Requested ${quantity}.`,
      });
    }

    // Calculate totals deterministically.
    const subtotal = Number((Number(product.price) * quantity).toFixed(2));
    const tax = Number((subtotal * 0.08).toFixed(2));
    const shipping = subtotal >= 100 ? 0 : 9.99;
    const total = Number((subtotal + tax + shipping).toFixed(2));

    // Atomic transaction: create order, item, deduct inventory, all or nothing.
    const order = await ctx.transaction(() => {
      // Final inventory check inside transaction before commit.
      const freshProduct = products.find(data.productId);
      const freshInventory = Number(freshProduct?.inventory || 0);

      if (quantity > freshInventory) {
        throw new FrameworkError('Insufficient inventory (rechecked at transaction time).', {
          status: 422,
          code: 'INSUFFICIENT_INVENTORY_AT_COMMIT',
          hint: `Race condition detected. Available: ${freshInventory}, requested: ${quantity}.`,
        });
      }

      const customer = customers.firstOrCreate({ email: data.email }, {
        firstName: 'Guest',
        lastName: 'Customer',
        status: 'active',
      });

      const createdOrder = orders.create({
        number: orderNumber(),
        email: data.email,
        status: 'pending',
        subtotal,
        tax,
        shipping,
        total,
        customerId: customer.id,
      });

      orderItems.create({
        orderId: createdOrder.id,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity,
        unitPrice: product.price,
        total: subtotal,
      });

      products.update(product.id, {
        inventory: Math.max(0, freshInventory - quantity),
      });

      return createdOrder;
    });

    // Dispatch event after successful commit.
    await ctx.event('order.placed', {
      orderId: order.id,
      number: order.number,
      email: order.email,
      total: order.total,
    });

    return order;
  },
});

