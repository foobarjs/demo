export default {
  name: process.env.APP_NAME || 'Foobar Shop',
  url: process.env.APP_URL || 'http://localhost:3000',
  port: parseInt(process.env.PORT || '3000'),
  env: process.env.NODE_ENV || 'development',
  debug: process.env.APP_DEBUG === undefined
    ? process.env.NODE_ENV !== 'production'
    : (process.env.APP_DEBUG === 'true' || process.env.APP_DEBUG === '1'),
  secret: process.env.APP_SECRET,
  log: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'storage/logs/app.log',
  },
  plugins: ['foobarjs/auth', 'foobarjs/admin', 'foobarjs/api', 'foobarjs/api-docs', 'foobarjs/queue', 'foobarjs/cache', 'foobarjs/notifications'],
}
