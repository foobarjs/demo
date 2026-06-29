import { field, hasMany, model } from '@foobarjs/framework';

export default model('Customer', {
  firstName: field.string().required().max(120),
  lastName: field.string().required().max(120),
  email: field.string().required().email().unique().max(255),
  phone: field.string().nullable().max(40),
  status: field.enum(['lead', 'active', 'vip', 'blocked']).default('active'),
  orders: hasMany('Order'),
  ...field.timestamps(),
}, {
  indexes: ['email', 'status'],
  scopes: {
    active: query => query.where('status', 'active'),
    vip: query => query.where('status', 'vip'),
  },
});
