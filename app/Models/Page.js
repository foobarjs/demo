import { field, model } from '@foobarjs/framework';

export default model('Page', {
  ...field.id(),
  title: field.string().required().max(255),
  slug: field.string().required().unique(),
  body: field.text().nullable(),
  status: field.enum(['draft', 'published']).default('draft'),
  ...field.timestamps(),
});
