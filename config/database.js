export default {
  connection: process.env.DB_CONNECTION || 'sqlite',
  database: process.env.DB_DATABASE || 'foobar.db',
}
