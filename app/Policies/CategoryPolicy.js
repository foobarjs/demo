import { Policy } from '@foobarjs/framework';
import Category from '#app/Models/Category.js';

export default class CategoryPolicy extends Policy {
  static model = Category;

  viewAny() { return true; }
  view() { return true; }
}
