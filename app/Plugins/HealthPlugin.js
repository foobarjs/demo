import { job, plugin } from '@foobarjs/framework';

export default plugin('health', ({ addAdminLink, addAdminWidget, addJob, route, schedule }) => {
  route.get('/_health', (ctx) => ctx.json({
    ok: true,
    app: 'foobarjs-ecommerce',
  }));

  addAdminLink({ label: 'Health', href: '/_health' });
  addAdminWidget({ label: 'Health', value: 'OK', href: '/_health' });

  addJob(job('HealthCheck', async () => ({
    ok: true,
    checkedAt: new Date().toISOString(),
  })));

  schedule.hourly('HealthCheck');
});
