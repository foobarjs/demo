import { field, request } from '@foobarjs/framework';

export default request('UpdateProductRequest', {
  name: field.string().max(180),
  slug: field.string().max(220),
  sku: field.string().max(80),
  description: field.text().nullable(),
  imagePath: field.string().nullable().max(500),
  price: field.decimal({ precision: 10, scale: 2 }).min(0),
  inventory: field.integer().min(0),
  status: field.enum(['draft', 'active', 'archived']),
});
