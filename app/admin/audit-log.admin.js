import { Admin, Column, Filter, Section } from 'foobarjs/admin'
import AuditLog from '../models/audit-log.model.js'

export default Admin.resource(AuditLog)
  .label('Audit Logs', 'Audit Log')
  .icon('bi-journal-text')
  .group('System')
  .displayLabel(log => `${log.action} ${log.modelType}#${log.modelId}`)
  .permissions({
    view: ['admin'],
    create: [],
    edit: [],
    delete: [],
  })
  .searchable('action', 'modelType')
  .defaultSort('createdAt', 'desc')
  .list(list => list
    .columns([
      Column.text('action').sortable(),
      Column.text('modelType').sortable(),
      Column.text('modelId'),
      Column.text('userId'),
      Column.date('createdAt').sortable(),
    ])
    .filters([
      Filter.select('action'),
      Filter.text('modelType').label('Model Type'),
      Filter.dateRange('createdAt').label('Date'),
    ])
  )
  .detail(detail => detail
    .sections([
      Section.make('Action').fields(['action', 'modelType', 'modelId']).columns(3),
      Section.make('User').fields(['userId']),
      Section.make('Timestamp').fields(['createdAt']),
    ])
  )
