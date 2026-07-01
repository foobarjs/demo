import { plugin } from '@foobarjs/framework';

export default plugin('health', (plugin) => {
  plugin.route.get('/_health', (ctx) => ctx.json({
    ok: true,
    app: 'foobarjs-ecommerce',
  }));

  plugin.admin.link({ label: 'Health', href: '/_health' });
  plugin.admin.widget({ label: 'Health', value: 'OK', href: '/_health' });

  plugin.job('HealthCheck', async () => ({
    ok: true,
    checkedAt: new Date().toISOString(),
  }));

  plugin.schedule.hourly('HealthCheck');
});
