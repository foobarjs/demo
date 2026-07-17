import { Admin, Column, Filter } from 'foobarjs/admin'
import SystemLog from '../models/system-log.model.js'

export default Admin.resource(SystemLog)
  .label('System Logs', 'Log')
  .icon('bi-terminal')
  .group('System')
  .searchable('message', 'source')
  .defaultSort('id', 'desc')
  .permissions({ view: true, create: ['admin'], edit: ['admin'], delete: ['admin'] })
  .list(list => list
    .columns([
      Column.text('id').sortable(),
      Column.badge('level', {
        info: 'info',
        warning: 'warning',
        error: 'danger',
      }),
      Column.text('message'),
      Column.text('source').sortable(),
      Column.date('createdAt').sortable(),
    ])
    .filters([
      Filter.select('level'),
    ])
  )
