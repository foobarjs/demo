import { Admin, Column, Filter } from 'foobarjs/admin'
import InventoryLog from '../models/inventory-log.model.js'

export default Admin.resource(InventoryLog)
  .label('Inventory Logs', 'Inventory Log')
  .icon('bi-box-seam')
  .group('Warehouse')
  .searchable('productName', 'sku', 'warehouse')
  .defaultSort('createdAt', 'desc')
  .list(list => list
    .columns([
      Column.text('productName').sortable(),
      Column.text('sku'),
      Column.number('quantity').sortable(),
      Column.badge('type', {
        inbound: 'success',
        outbound: 'warning',
        adjustment: 'info',
        return: 'secondary',
      }),
      Column.text('warehouse'),
      Column.date('createdAt').sortable(),
    ])
    .filters([
      Filter.select('type'),
    ])
  )
