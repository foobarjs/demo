import { FrameworkError } from '@foobarjs/framework';
import Customer from '#app/Models/Customer.js';
import OrderPlaced from '#app/Events/OrderPlaced.js';
import Order from '#app/Models/Order.js';
import OrderItem from '#app/Models/OrderItem.js';
import Product from '#app/Models/Product.js';

export default class Checkout {
  constructor(ctx) {
    this.ctx = ctx;
  }

  async place(data) {
    const product = this.availableProduct(data.productId);
    const quantity = this.quantityFrom(data);
    this.ensureInventory(product, quantity);

    const totals = this.totalsFor(product, quantity);
    const order = await this.ctx.transaction(() => this.createOrder(data, product, quantity, totals));

    await this.publishOrderPlaced(order);
    return order;
  }

  availableProduct(productId) {
    const product = Product.find(productId);
    if (!product || product.status !== 'active') {
      throw new FrameworkError('Product is not available.', {
        status: 422,
        code: 'PRODUCT_UNAVAILABLE',
        hint: 'The product may have been removed or deactivated.',
      });
    }
    return product;
  }

  quantityFrom(data) {
    return Number(data.quantity || 1);
  }

  ensureInventory(product, quantity) {
    const availableInventory = Number(product?.inventory || 0);
    if (quantity > availableInventory) {
      throw new FrameworkError('Insufficient inventory.', {
        status: 422,
        code: 'INSUFFICIENT_INVENTORY',
        hint: `Only ${availableInventory} available. Requested ${quantity}.`,
      });
    }
  }

  totalsFor(product, quantity) {
    const subtotal = Number((Number(product.price) * quantity).toFixed(2));
    const tax = Number((subtotal * 0.08).toFixed(2));
    const shipping = subtotal >= 100 ? 0 : 9.99;
    const total = Number((subtotal + tax + shipping).toFixed(2));
    return { subtotal, tax, shipping, total };
  }

  createOrder(data, product, quantity, totals) {
    const freshProduct = Product.find(data.productId);
    const freshInventory = Number(freshProduct?.inventory || 0);

    if (quantity > freshInventory) {
      throw new FrameworkError('Insufficient inventory (rechecked at transaction time).', {
        status: 422,
        code: 'INSUFFICIENT_INVENTORY_AT_COMMIT',
        hint: `Race condition detected. Available: ${freshInventory}, requested: ${quantity}.`,
      });
    }

    const customer = Customer.firstOrCreate({ email: data.email }, {
      firstName: 'Guest',
      lastName: 'Customer',
      status: 'active',
    });

    const order = Order.create({
      number: this.orderNumber(),
      email: data.email,
      status: 'pending',
      subtotal: totals.subtotal,
      tax: totals.tax,
      shipping: totals.shipping,
      total: totals.total,
      customerId: customer.id,
    });

    OrderItem.create({
      orderId: order.id,
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity,
      unitPrice: product.price,
      total: totals.subtotal,
    });

    Product.update(product.id, {
      inventory: Math.max(0, freshInventory - quantity),
    });

    return order;
  }

  async publishOrderPlaced(order) {
    await this.ctx.event(new OrderPlaced({
      orderId: order.id,
      number: order.number,
      email: order.email,
      total: order.total,
    }));
  }

  orderNumber() {
    return `ORD-${Date.now().toString(36).toUpperCase()}`;
  }
}
