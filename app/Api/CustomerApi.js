import { ApiResource } from '@foobarjs/framework';
import Customer from '#app/Models/Customer.js';

export default class CustomerApi extends ApiResource {
  static model = Customer;
  static actions = ['index', 'show'];
  static authorize = {
    index: 'viewAny',
    show: 'view',
  };
  static search = ['firstName', 'lastName', 'email'];
  static sort = ['id', 'firstName', 'lastName', 'email', 'status', 'createdAt'];
  static filters = ['status'];
  static includes = [];
  static withCount = ['orders'];
  static pagination = { defaultPerPage: 50, maxPerPage: 200 };
  static middleware = ['api'];
  static docs = {
    summary: 'Customer records for admin and backoffice integrations (admin only).',
  };
}
