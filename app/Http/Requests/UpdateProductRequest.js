import { field, request } from '@foobarjs/framework';

export default request('UpdateProductRequest', {
  name: field.string().max(180),
  slug: field.string().max(220),
  sku: field.string().max(80),
  description: field.text().nullable(),
  imagePath: field
    .string()
    .nullable()
    .max(500)
    .regex(/^(?!\/)(?!.*\.\.)(?!.*\\.\.)[A-Za-z0-9/_\-.]+$/, 'Use a normalized relative storage path.'),
  price: field.decimal({ precision: 10, scale: 2 }).min(0),
  inventory: field.integer().min(0),
  status: field.enum(['draft', 'active', 'archived']),
});
