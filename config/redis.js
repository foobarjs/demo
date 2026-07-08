export default {
  default: process.env.REDIS_CONNECTION || 'default',
  connections: {
    default: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_DB || '0'),
      password: process.env.REDIS_PASSWORD || undefined,
    },
    cache: {
      host: process.env.REDIS_CACHE_HOST || process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_CACHE_PORT || process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_CACHE_DB || process.env.REDIS_DB || '1'),
      password: process.env.REDIS_CACHE_PASSWORD || process.env.REDIS_PASSWORD || undefined,
    },
  },
}
