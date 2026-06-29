import { controller } from '@foobarjs/framework';

export default controller('CheckoutController', {
  async show(ctx) {
    const product = ctx.model('Product').findOrFail(ctx.query.product || 1);
    return ctx.view('checkout/show', {
      title: `Checkout ${product.name}`,
      product,
    });
  },

  async store(ctx) {
    const data = await ctx.validate('CheckoutRequest');
    const order = await ctx.service('CheckoutService').checkout(ctx, data);
    return ctx.redirect(`/checkout/thanks?id=${order.id}`);
  },

  async thanks(ctx) {
    const order = ctx.model('Order').findOrFail(ctx.query.id);
    return ctx.view('checkout/thanks', {
      title: 'Order placed',
      order,
    });
  },
});
