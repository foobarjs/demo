import { Admin, Action, Column, Filter, Section, Widget } from 'foobarjs/admin'
import Event from '../models/event.model.js'
import Order from '../models/order.model.js'

export default Admin.resource(Event)
  .label('Events', 'Event')
  .icon('bi-calendar-event')
  .group('Events')
  .displayLabel(e => e.title)
  .dashboard({ icon: 'bi-calendar-event', color: 'success' })
  .permissions({
    view: ['admin', 'organizer'],
    create: ['admin', 'organizer'],
    edit: ['admin', 'organizer'],
    delete: ['admin'],
  })
  .searchable('title', 'venue')
  .defaultSort('startsAt', 'desc')
  .list(list => list
    .columns([
      Column.text('title').sortable(),
      Column.belongsTo('organizer'),
      Column.badge('status', {
        draft: 'secondary',
        published: 'success',
        cancelled: 'danger',
        completed: 'info',
      }),
      Column.text('venue'),
      Column.date('startsAt').sortable(),
      Column.date('endsAt'),
    ])
    .filters([
      Filter.select('status'),
      Filter.belongsTo('organizer'),
      Filter.dateRange('startsAt').label('Start Date'),
    ])
    .actions([
      Action.make('cancel', 'Cancel Event')
        .icon('bi-x-circle')
        .handler(async (event) => {
          event.status = 'cancelled'
          await event.save()
          return 'Event has been cancelled.'
        }),
    ])
  )
  .form(form => form
    .sections([
      Section.make('Details').fields(['title', 'description', 'status']).columns(2),
      Section.make('Schedule').fields(['startsAt', 'endsAt', 'venue', 'location']).columns(2).icon('bi-clock'),
      Section.make('Settings').fields(['maxAttendees', 'organizer', 'coverImage']).columns(2),
    ])
  )
  .detail(detail => detail
    .sections([
      Section.make('Overview').fields(['title', 'slug', 'status', 'organizer']).columns(2),
      Section.make('Schedule').fields(['startsAt', 'endsAt', 'venue', 'location']).columns(2).icon('bi-clock'),
      Section.make('Description').fields(['description']),
    ])
  )
  .widgets([
    Widget.count('total-events', Event)
      .label('Total Events')
      .icon('bi-calendar-event'),
    Widget.sum('event-revenue', Order, 'total')
      .format('currency', { currency: 'USD' })
      .label('Event Revenue')
      .icon('bi-currency-dollar'),
  ])
