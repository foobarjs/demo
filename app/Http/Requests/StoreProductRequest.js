import { Request, field } from '@foobarjs/framework';

export default class StoreProductRequest extends Request {
  name = field.string().required().max(180);
  slug = field.string().required().max(220);
  sku = field.string().required().max(80);
  description = field.text().nullable();
  imagePath = field
    .string()
    .nullable()
    .max(500)
    .regex(/^(?!\/)(?!.*\.\.)(?!.*\\.\.)[A-Za-z0-9/_\-.]+$/, 'Use a normalized relative storage path.');
  price = field.decimal({ precision: 10, scale: 2 }).required().min(0);
  inventory = field.integer().required().min(0);
  status = field.enum(['draft', 'active', 'archived']).default('active');
}
