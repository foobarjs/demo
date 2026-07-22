import { Admin, Action, Column, Filter, Section } from 'foobarjs/admin'
import Attendee from '../models/attendee.model.js'

export default Admin.resource(Attendee)
  .label('Attendees', 'Attendee')
  .icon('bi-person-badge')
  .group('Events')
  .displayLabel(a => a.name)
  .dashboard({ icon: 'bi-person-badge', color: 'info' })
  .permissions({
    view: ['admin', 'organizer'],
    create: ['admin', 'organizer'],
    edit: ['admin', 'organizer'],
    delete: ['admin'],
  })
  .searchable('name', 'email', 'ticketCode')
  .defaultSort('createdAt', 'desc')
  .list(list => list
    .columns([
      Column.text('name').sortable(),
      Column.text('email'),
      Column.text('ticketCode'),
      Column.belongsTo('event'),
      Column.belongsTo('ticketType'),
      Column.badge('checkedInAt', {
        _truthy: 'success',
        _falsy: 'secondary',
      }),
    ])
    .filters([
      Filter.belongsTo('event'),
    ])
    .actions([
      Action.make('checkIn', 'Check In')
        .icon('bi-box-arrow-in-right')
        .confirm('Check in this attendee?')
        .handler(async (attendee) => {
          attendee.checkedInAt = new Date()
          await attendee.save()
          return 'Attendee checked in successfully.'
        }),
    ])
  )
  .form(form => form
    .sections([
      Section.make('Attendee Info').fields(['name', 'email', 'ticketCode']).columns(2),
      Section.make('Event').fields(['event', 'ticketType', 'order']).columns(2),
    ])
  )
  .detail(detail => detail
    .sections([
      Section.make('Attendee Info').fields(['name', 'email', 'ticketCode']).columns(2),
      Section.make('Event').fields(['event', 'ticketType', 'order']).columns(2),
      Section.make('Check-In').fields(['checkedInAt']),
    ])
  )
