import { controller } from '@foobarjs/framework';

/**
 * Checkout controller handles product purchase flow with error recovery.
 *
 * show: Display checkout form with product details and inventory status.
 * store: Validate and process checkout; redisplay form on validation error.
 * thanks: Confirmation page after successful order.
 */
export default controller('CheckoutController', {
  async show(ctx) {
    const product = ctx.model('Product').findOrFail(ctx.query.product || 1);
    return ctx.view('checkout/show', {
      title: `Checkout ${product.name}`,
      product,
      routes: {
        checkoutStore: ctx.route('checkout.store'),
      },
    });
  },

  async store(ctx) {
    try {
      const data = await ctx.validate('CheckoutRequest');
      const order = await ctx.service('CheckoutService').checkout(ctx, data);
      return ctx.redirectRoute('checkout.thanks', { id: order.id });
    } catch (error) {
      // On validation error, try to recover product from validated partial data or fallback
      let productId = 1;
      let product = null;
      
      if (error.validated?.productId) {
        productId = error.validated.productId;
        product = ctx.model('Product').find(productId);
      }

      // Validation errors: re-render form with old input and error messages.
      if (error.status === 422 && error.errors) {
        return ctx.view('checkout/show', {
          title: product ? `Checkout ${product.name}` : 'Checkout',
          product: product || { id: productId, name: 'Product', price: 0, inventory: 0 },
          errors: error.errors,
          routes: {
            checkoutStore: ctx.route('checkout.store'),
          },
        });
      }

      // Service-level errors (insufficient inventory, etc.): flash and redisplay.
      if (error.status === 422 && error.code) {
        ctx.flash('error', error.message);
        return ctx.view('checkout/show', {
          title: product ? `Checkout ${product.name}` : 'Checkout',
          product: product || { id: productId, name: 'Product', price: 0, inventory: 0 },
          routes: {
            checkoutStore: ctx.route('checkout.store'),
          },
        });
      }

      // Re-throw unexpected errors to framework error handler.
      throw error;
    }
  },

  async thanks(ctx) {
    const order = ctx.model('Order').findOrFail(ctx.query.id);
    return ctx.view('checkout/thanks', {
      title: 'Order placed',
      order,
      adminOrderPath: '/_admin/order',
    });
  },
});

