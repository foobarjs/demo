import { belongsTo, field, hasMany, model } from '@foobarjs/framework';

export default model('Product', {
  ...field.id(),
  name: field.string().required().max(180),
  slug: field.string().required().unique().max(220),
  sku: field.string().required().unique().max(80),
  description: field.text().nullable(),
  imagePath: field.string().nullable(),
  price: field.decimal({ precision: 10, scale: 2 }).required().min(0),
  inventory: field.integer().required().min(0).default(0),
  status: field.enum(['draft', 'active', 'archived']).default('active'),
  category: belongsTo('Category').nullable(),
  orderItems: hasMany('OrderItem'),
  ...field.timestamps(),
}, {
  indexes: ['sku', 'slug', 'status', 'categoryId'],
  scopes: {
    active: query => query.where('status', 'active'),
    lowStock: query => query.where('inventory', '<=', 10),
  },
});
