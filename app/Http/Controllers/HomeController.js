import { controller } from '@foobarjs/framework';

export default controller('HomeController', {
  async index(ctx) {
    const products = ctx.model('Product').active().latest('id').limit(6).get();
    const productList = products.length
      ? products.map((product) => `<li><strong>${product.name}</strong> · $${product.price} · <a href="/checkout?product=${product.id}">Buy</a></li>`).join('')
      : '<li>No products yet. Run npm run seed -- --fresh --count 25.</li>';
    return ctx.view('home/index', {
      title: 'Foobar Commerce',
      message: 'A tiny ecommerce app showcasing foobarjs models, admin, API resources, jobs, events, and seeders.',
      productList,
    });
  },
});
