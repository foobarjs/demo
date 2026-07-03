import { Controller } from '@foobarjs/framework';
import Checkout from '#app/Checkout.js';
import Order from '#app/Models/Order.js';
import Product from '#app/Models/Product.js';

export default class CheckoutController extends Controller {
  async show(ctx) {
    const product = Product.findOrFail(ctx.query.product || 1);
    return ctx.view('checkout/show', {
      title: `Checkout ${product.name}`,
      product,
      inStock: product.inventory > 0,
      hasErrors: false,
      routes: {
        checkoutStore: ctx.route('checkout.store'),
      },
    });
  }

  async store(ctx) {
    try {
      const data = await ctx.validate('CheckoutRequest');
      const order = await new Checkout(ctx).place(data);
      return ctx.redirectRoute('checkout.thanks', { id: order.id });
    } catch (error) {
      let productId = 1;
      let product = null;

      if (error.validated?.productId) {
        productId = error.validated.productId;
        product = Product.find(productId);
      }

      const fallbackProduct = product || { id: productId, name: 'Product', price: 0, inventory: 0 };

      if (error.status === 422 && error.errors) {
        return ctx.view('checkout/show', {
          title: product ? `Checkout ${product.name}` : 'Checkout',
          product: fallbackProduct,
          inStock: fallbackProduct.inventory > 0,
          errors: error.errors,
          hasErrors: error.errors.length > 0,
          routes: {
            checkoutStore: ctx.route('checkout.store'),
          },
        });
      }

      if (error.status === 422 && error.code) {
        ctx.flash('error', error.message);
        return ctx.view('checkout/show', {
          title: product ? `Checkout ${product.name}` : 'Checkout',
          product: fallbackProduct,
          inStock: fallbackProduct.inventory > 0,
          hasErrors: false,
          routes: {
            checkoutStore: ctx.route('checkout.store'),
          },
        });
      }

      throw error;
    }
  }

  async thanks(ctx) {
    const order = Order.findOrFail(ctx.query.id);
    return ctx.view('checkout/thanks', {
      title: 'Order placed',
      order,
      adminOrderPath: '/_admin/order',
    });
  }
}
