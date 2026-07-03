import { Model, field } from '@foobarjs/framework';

export default class User extends Model {
  static indexes = ['email', 'role', 'status'];
  static hidden = ['password'];

  name = field.string().required().max(120);
  email = field.string().required().email().unique().max(255);
  password = field.string().required().max(255);
  role = field.enum(['admin', 'editor', 'viewer']).default('admin');
  status = field.enum(['active', 'disabled']).default('active');
}
