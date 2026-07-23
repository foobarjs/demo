const driver = process.env.DB_CONNECTION || 'sqlite'

const base = driver === 'mongodb'
  ? {
      driver: 'mongodb',
      database: process.env.MONGO_DATABASE || 'foobar_demo_dogfood',
      host: process.env.MONGO_HOST || 'localhost',
      port: Number(process.env.MONGO_PORT || 27017),
    }
  : {
      driver,
      database: process.env.DB_DATABASE || 'foobar.db',
    }

export default {
  ...base,

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
