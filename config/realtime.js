export default {
  enabled: process.env.REALTIME_ENABLED !== 'false',
  path: process.env.REALTIME_PATH || '/ws',
  redisBroadcast: process.env.REALTIME_REDIS_BROADCAST === 'true',
}
