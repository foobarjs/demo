import { action, adminResource, column, field, filter, lens } from '@foobarjs/framework';

export default adminResource('Product', {
  label: 'Products',
  display: 'name',
  list: [
    column('imagePath').image({ disk: 'public', directory: 'products' }).label('Image'),
    column('name').searchable().sortable(),
    column('sku').searchable().sortable().label('SKU'),
    column('category').relationship({ perPage: 25, placeholder: 'Search categories' }),
    column('price').money('USD').sortable(),
    column('inventory').sortable(),
    column('status').badge({ draft: 'secondary', active: 'success', archived: 'warning' }).sortable(),
  ],
  form: [
    column('category').relationship({ perPage: 25, placeholder: 'Search categories' }),
    column('name').placeholder('Everyday Tote'),
    column('slug').placeholder('everyday-tote'),
    column('sku').placeholder('BAG-TOTE-001'),
    column('description'),
    column('imagePath').image({ disk: 'public', directory: 'products', preserveName: true }).label('Image'),
    column('price'),
    column('inventory'),
    column('status'),
  ],
  filters: [
    filter.relationship('category', { perPage: 25 }).placeholder('Search categories'),
    filter.enum('status'),
  ],
  lenses: [
    lens('active', {
      label: 'Active',
      query: query => query.active(),
    }),
    lens('lowStock', {
      label: 'Low stock',
      query: query => query.lowStock(),
      columns: [
        column('name').searchable().sortable(),
        column('sku').searchable().sortable(),
        column('inventory').sortable(),
        column('status').badge({ draft: 'secondary', active: 'success', archived: 'warning' }),
      ],
    }),
  ],
  actions: [
    action('archive', ({ record }) => {
      record.update({ status: 'archived' });
    }).row().label('Archive').secondary().confirm('Archive this product?'),
    action('restock', ({ data, record }) => {
      record.update({ inventory: Number(record.inventory || 0) + Number(data.quantity || 0) });
    }).row().label('Restock').form({
      quantity: field.integer().required().min(1),
    }),
  ],
  relationships: [
    { name: 'orderItems', label: 'Order items', perPage: 10 },
  ],
});
