import { ApiResource } from '@foobarjs/framework';
import Product from '#app/Models/Product.js';

export default class ProductApi extends ApiResource {
  static model = Product;
  static search = 'name';
  static filters = ['status', 'categoryId'];
  static sort = ['id', 'name', 'price', 'inventory', 'status'];
  static includes = ['category'];
  static withCount = ['orderItems'];
  static pagination = { defaultPerPage: 25, maxPerPage: 50 };
  static actions = ['index', 'show', 'store', 'update', 'destroy'];
  static requests = {
    store: 'StoreProductRequest',
    update: 'UpdateProductRequest',
  };
  static authorize = {
    index: 'viewAny',
    show: 'view',
    store: 'apiStore',
    update: 'apiUpdate',
    destroy: 'apiDelete',
  };
  static middleware = ['api'];
  static docs = {
    summary: 'Products available in the storefront catalog.',
  };
}
