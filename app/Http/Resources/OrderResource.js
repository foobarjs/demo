import { resource } from '@foobarjs/framework';

export default resource('OrderResource', {
  async toObject(order, ctx) {
    return {
      id: order.id,
      number: order.number,
      email: order.email,
      status: order.status,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      total: order.total,
      customerId: order.customerId,
      canUpdate: await ctx.can('update', order),
    };
  },
});
