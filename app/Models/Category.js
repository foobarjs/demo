import { Model, field } from '@foobarjs/framework';

export default class Category extends Model {
  static indexes = ['slug', 'status'];

  name = field.string().required().max(120);
  slug = field.string().required().unique().max(160);
  description = field.text().nullable();
  status = field.enum(['draft', 'active', 'archived']).default('active');
  products = field.hasMany('Product');

  active() {
    return this.query().where('status', 'active');
  }
}
