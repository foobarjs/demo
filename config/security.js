export default {
  helmet: { contentSecurityPolicy: false },
  // Rate limit non-admin traffic. /admin/* and /admin-assets/* are skipped
  // by default because they are authenticated and can be chatty (combobox
  // lookups, preference toggles, etc.). Pass 'skip: []' to disable this,
  // or 'skip: ['/api/*']' to configure your own skip list.
  rateLimit: { max: 100, windowMs: 60000 },
}
