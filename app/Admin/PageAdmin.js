import { AdminResource, column, filter } from '@foobarjs/framework/admin';
import Page from '#app/Models/Page.js';

export default class PageAdmin extends AdminResource {
  static model = Page;
  static label = 'Pages';
  static display = 'title';

  list = [
    column('title').searchable().sortable(),
    column('slug').searchable().sortable(),
    column('status').badge({ draft: 'secondary', published: 'success' }).searchable().sortable(),
  ];

  filters = [
    filter.enum('status'),
  ];
}
