import { field, model } from '@foobarjs/framework';

export default model('User', {
  ...field.id(),
  name: field.string().required().max(120),
  email: field.string().required().email().unique().max(255),
  password: field.string().required().max(255),
  role: field.enum(['admin', 'editor', 'viewer']).default('admin'),
  status: field.enum(['active', 'disabled']).default('active'),
  ...field.timestamps(),
}, {
  indexes: ['email', 'role', 'status'],
  hidden: ['password'],
});
