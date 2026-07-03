import { Controller } from '@foobarjs/framework';
import Product from '#app/Models/Product.js';

export default class HomeController extends Controller {
  async index(ctx) {
    const products = Product.active().latest('id').limit(6).get();
    const links = {
      checkout: ctx.route('checkout.show', { product: 1 }),
      login: ctx.route('auth.login.show'),
      account: ctx.route('auth.account'),
      productsApi: '/api/products',
      admin: '/_admin',
    };
    const productViews = products.map((product) => ({
      ...product,
      imageUrl: product.imagePath ? ctx.storage.disk('public').url(product.imagePath) : null,
      checkoutUrl: ctx.route('checkout.show', { product: product.id }),
    }));
    return ctx.view('home/index', {
      title: 'Foobar Commerce',
      message: 'A tiny ecommerce app showcasing foobarjs models, admin, API resources, jobs, events, and seeders.',
      links,
      products: productViews,
    });
  }
}
