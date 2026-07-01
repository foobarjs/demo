/**
 * index.js — application setup
 *
 * Runs once at startup. Use this file to share view data with every template,
 * register view composers, and for smaller apps declare models, routes,
 * controllers, and services inline without separate files.
 *
 * The `app` registrar has the same full surface as a plugin's setup() function.
 */
export default function (app) {
  // Data available to every view — no controller needs to pass these manually.
  app.view.share('appName', 'foobarjs Demo');
  app.view.share('year', new Date().getFullYear());

  // Inject route helpers into all checkout views automatically.
  app.view.composer('checkout/*', async (data, ctx) => ({
    checkoutRoutes: {
      store: ctx.route('checkout.store'),
    },
  }));
}
