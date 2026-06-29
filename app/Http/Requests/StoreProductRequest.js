import { field, request } from '@foobarjs/framework';

export default request('StoreProductRequest', {
  name: field.string().required().max(180),
  slug: field.string().required().max(220),
  sku: field.string().required().max(80),
  description: field.text().nullable(),
  price: field.decimal({ precision: 10, scale: 2 }).required().min(0),
  inventory: field.integer().required().min(0),
  status: field.enum(['draft', 'active', 'archived']).default('active'),
});
