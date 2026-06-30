import { controller, escapeHtml } from '@foobarjs/framework';

export default controller('HomeController', {
  async index(ctx) {
    const products = ctx.model('Product').active().latest('id').limit(6).get();
    const links = {
      checkout: ctx.route('checkout.show', { product: 1 }),
      login: ctx.route('auth.login.show'),
      account: ctx.route('auth.account'),
      productsApi: '/api/products',
      admin: '/_admin',
    };
    const productList = products.length
      ? products.map((product) => {
          const image = product.imagePath
            ? `<img src="${ctx.storage.disk('public').url(product.imagePath)}" alt="" width="72" height="54"> `
            : '';
          return `<li>${image}<strong>${escapeHtml(product.name)}</strong> · $${escapeHtml(product.price)} · <a href="${ctx.route('checkout.show', { product: product.id })}">Buy</a></li>`;
        }).join('')
      : '<li>No products yet. Run npm run seed -- --fresh --count 25.</li>';
    return ctx.view('home/index', {
      title: 'Foobar Commerce',
      message: 'A tiny ecommerce app showcasing foobarjs models, admin, API resources, jobs, events, and seeders.',
      links,
      productList,
    });
  },
});
