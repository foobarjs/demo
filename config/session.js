export default {
  driver: process.env.SESSION_DRIVER || 'cookie',
  lifetime: 120,
  secure: process.env.NODE_ENV === 'production',
}
