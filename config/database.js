export default {
  driver: process.env.DB_CONNECTION || 'sqlite',
  database: process.env.DB_DATABASE || 'foobar.db',

  connections: {
    postgres: {
      driver: 'postgres',
      host: process.env.PG_HOST || 'localhost',
      port: Number(process.env.PG_PORT || 5444),
      database: process.env.PG_DATABASE || 'foobar_demo',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      autoSync: true,
      readOnly: true,
    },
  },
}
