export default {
  default: process.env.QUEUE_CONNECTION || 'database',
  connections: {
    sync: { driver: 'sync' },
    database: { driver: 'database', table: 'jobs', queue: 'default' },
    redis: {
      driver: 'redis',
      connection: process.env.REDIS_QUEUE_CONNECTION || 'default',
    },
  },
}
