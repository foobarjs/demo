import { Admin, Action, Field } from 'foobarjs/admin'
import { AdminExport } from 'foobarjs/admin'

export default Admin.resource(AdminExport)
  .list(list => list
    .actions([
      Action.make('download', 'Download')
        .icon('bi-download')
        .variant('primary')
        .can('view')
        .visible(({ item }) => item.status === 'complete' && !!item.filePath)
        .handler((item, ctx) => ctx.redirect(`/admin/exports/${item.id}/download`))
        .confirm(),
    ])
  )
  .detail(detail => detail
    .fields([
      'id', 'resource', 'format', 'status', 'totalRows', 'processedRows',
      Field.make('filePath').display((item) => {
        const path = item.filePath
        if (!path || item.status !== 'complete') return path || '—'
        const filename = path.split('/').pop()
        return `<a href="/admin/exports/${item.id}/download" class="text-decoration-none"><i class="bi bi-download me-1"></i>${filename}</a>`
      }),
      'fileSize', 'error',
    ])
  )
