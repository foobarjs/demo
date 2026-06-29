import { field, hasMany, model } from '@foobarjs/framework';

export default model('Category', {
  name: field.string().required().max(120),
  slug: field.string().required().unique().max(160),
  description: field.text().nullable(),
  status: field.enum(['draft', 'active', 'archived']).default('active'),
  products: hasMany('Product'),
  ...field.timestamps(),
}, {
  indexes: ['slug', 'status'],
  scopes: {
    active: query => query.where('status', 'active'),
  },
});
