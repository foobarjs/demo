import { Model, field } from '@foobarjs/framework';
import Category from './Category.js';

export default class Product extends Model {
  static indexes = ['sku', 'slug', 'status', 'categoryId'];

  name = field.string().required().max(180);
  slug = field.string().required().unique().max(220);
  sku = field.string().required().unique().max(80);
  description = field.text().nullable();
  imagePath = field.string().nullable();
  price = field.decimal({ precision: 10, scale: 2 }).required().min(0);
  inventory = field.integer().required().min(0).default(0);
  status = field.enum(['draft', 'active', 'archived']).default('active');
  category = field.belongsTo(Category).nullable();
  orderItems = field.hasMany('OrderItem');

  active() {
    return this.query().where('status', 'active');
  }

  lowStock() {
    return this.query().where('inventory', '<=', 10);
  }
}
