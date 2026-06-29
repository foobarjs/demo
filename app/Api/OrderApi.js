import { apiResource } from '@foobarjs/framework';

export default apiResource('Order', {
  path: '/api/orders',
  resource: 'OrderResource',
  actions: ['index', 'show'],
  authorize: false,
  middleware: ['api'],
  docs: {
    summary: 'Read-only order API for backoffice integrations.',
  },
});
