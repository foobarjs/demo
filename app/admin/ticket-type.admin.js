import { Admin, Column, Filter, Section } from 'foobarjs/admin'
import TicketType from '../models/ticket-type.model.js'

export default Admin.resource(TicketType)
  .label('Ticket Types', 'Ticket Type')
  .icon('bi-ticket-perforated')
  .group('Events')
  .displayLabel(t => t.name)
  .permissions({
    view: ['admin', 'organizer'],
    create: ['admin', 'organizer'],
    edit: ['admin', 'organizer'],
    delete: ['admin'],
  })
  .defaultSort('name', 'asc')
  .list(list => list
    .columns([
      Column.text('name').sortable(),
      Column.belongsTo('event'),
      Column.money('price').sortable(),
      Column.text('sold').sortable(),
      Column.text('quantity').sortable(),
    ])
    .filters([
      Filter.belongsTo('event'),
    ])
  )
  .form(form => form
    .sections([
      Section.make('Details').fields(['name', 'description', 'event']).columns(2),
      Section.make('Pricing & Availability').fields(['price', 'quantity']).columns(2).icon('bi-cash'),
    ])
  )
  .detail(detail => detail
    .sections([
      Section.make('Details').fields(['name', 'description', 'event']).columns(2),
      Section.make('Availability').fields(['price', 'sold', 'quantity']).columns(3).icon('bi-cash'),
    ])
  )
