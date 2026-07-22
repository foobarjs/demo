import { Admin, Column, Filter, Section } from 'foobarjs/admin'
import DiscountCode from '../models/discount-code.model.js'

export default Admin.resource(DiscountCode)
  .label('Discount Codes', 'Discount Code')
  .icon('bi-tag')
  .group('Events')
  .displayLabel(d => d.code)
  .permissions({
    view: ['admin', 'organizer'],
    create: ['admin'],
    edit: ['admin'],
    delete: ['admin'],
  })
  .defaultSort('createdAt', 'desc')
  .list(list => list
    .columns([
      Column.text('code').sortable(),
      Column.text('type'),
      Column.text('value').sortable(),
      Column.text('usedCount'),
      Column.text('maxUses'),
      Column.date('expiresAt').sortable(),
      Column.belongsTo('event'),
    ])
    .filters([
      Filter.belongsTo('event'),
    ])
  )
  .form(form => form
    .sections([
      Section.make('Code Details').fields(['code', 'type', 'value']).columns(3),
      Section.make('Limits').fields(['maxUses', 'expiresAt', 'event']).columns(2).icon('bi-shield-check'),
    ])
  )
  .detail(detail => detail
    .sections([
      Section.make('Code Details').fields(['code', 'type', 'value']).columns(3),
      Section.make('Usage').fields(['usedCount', 'maxUses', 'expiresAt']).columns(3),
      Section.make('Event').fields(['event']),
    ])
  )
