import { Job, Plugin } from '@foobarjs/framework';

class HealthCheck extends Job {
  async handle() {
    return {
      ok: true,
      checkedAt: new Date().toISOString(),
    };
  }
}

export default class HealthPlugin extends Plugin {
  static pluginName = 'health';

  register(plugin) {
    plugin.route.get('/_health', (ctx) => ctx.json({
      ok: true,
      app: 'foobarjs-ecommerce',
    }));

    plugin.admin.link({ label: 'Health', href: '/_health' });
    plugin.admin.widget({ label: 'Health', value: 'OK', href: '/_health' });
    plugin.job(HealthCheck);
    plugin.schedule.hourly(HealthCheck);
  }
}
