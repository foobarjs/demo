import { service } from '@foobarjs/framework';

function orderNumber() {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

export default service('CheckoutService', {
  async checkout(ctx, data) {
    const products = ctx.model('Product');
    const customers = ctx.model('Customer');
    const orders = ctx.model('Order');
    const orderItems = ctx.model('OrderItem');

    const product = products.findOrFail(data.productId);
    const quantity = Number(data.quantity || 1);
    const subtotal = Number(product.price) * quantity;
    const tax = Number((subtotal * 0.08).toFixed(2));
    const shipping = subtotal >= 100 ? 0 : 9.99;
    const total = Number((subtotal + tax + shipping).toFixed(2));

    const order = await ctx.transaction(() => {
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
        inventory: Math.max(0, Number(product.inventory || 0) - quantity),
      });

      return createdOrder;
    });

    await ctx.event('order.placed', {
      orderId: order.id,
      number: order.number,
      email: order.email,
      total: order.total,
    });

    return order;
  },
});
