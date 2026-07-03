import { ApiResource } from '@foobarjs/framework';
import Category from '#app/Models/Category.js';

export default class CategoryApi extends ApiResource {
  static model = Category;
  static actions = ['index', 'show'];
  static search = 'name';
  static sort = ['id', 'name', 'slug', 'status'];
  static filters = ['status'];
  static pagination = { defaultPerPage: 25, maxPerPage: 100 };
  static middleware = ['api'];
  static docs = {
    summary: 'Product categories for storefront and integrations.',
  };
}
