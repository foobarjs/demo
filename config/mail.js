export default {
  driver: process.env.MAIL_DRIVER || 'log',
  from: process.env.MAIL_FROM || 'hello@foobarevents.com',
  smtp: {
    host: process.env.MAIL_HOST || 'localhost',
    port: parseInt(process.env.MAIL_PORT || '1025'),
  },
}
