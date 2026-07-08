export default {
  default: process.env.CACHE_STORE || 'database',
  stores: {
    memory: { driver: 'memory' },
    file: { driver: 'file', path: 'storage/framework/cache' },
    database: { driver: 'database', table: 'cache' },
    redis: {
      driver: 'redis',
      connection: process.env.REDIS_CACHE_CONNECTION || 'cache',
    },
  },
}
