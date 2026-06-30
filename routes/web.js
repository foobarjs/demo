export default function routes(route) {
  route.get('/', 'HomeController.index').name('home');

  route.get('/login', 'LoginController.show').name('auth.login.show').middleware('RedirectIfAuthenticated');
  route.post('/login', 'LoginController.store').name('auth.login.store').middleware('RedirectIfAuthenticated');

  route.get('/account', 'LoginController.account').name('auth.account').middleware('auth');
  route.post('/logout', 'LoginController.logout').name('auth.logout').middleware('auth', 'VerifyCsrfToken');

  route.get('/checkout', 'CheckoutController.show').name('checkout.show');
  route.post('/checkout', 'CheckoutController.store').name('checkout.store');
  route.get('/checkout/thanks', 'CheckoutController.thanks').name('checkout.thanks');
}
