export default {
  name: process.env.APP_NAME || 'foobarjs ecommerce',
  env: process.env.APP_ENV || process.env.NODE_ENV || 'local',
  debug: process.env.APP_DEBUG
    ? process.env.APP_DEBUG === 'true'
    : process.env.APP_ENV !== 'production' && process.env.NODE_ENV !== 'production',
  url: process.env.APP_URL || 'http://localhost:3000',
};
