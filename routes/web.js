export default function routes(route) {
  route.get('/', 'HomeController.index');
  route.get('/checkout', 'CheckoutController.show');
  route.post('/checkout', 'CheckoutController.store');
  route.get('/checkout/thanks', 'CheckoutController.thanks');
}
