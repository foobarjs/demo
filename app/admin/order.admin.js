import { Admin, Action, ExportAction, Column, Filter, Section, Widget } from 'foobarjs/admin'
import Order from '../models/order.model.js'

export default Admin.resource(Order)
  .label('Orders', 'Order')
  .icon('bi-receipt')
  .group('Events')
  .displayLabel(o => o.orderNumber || `Order #${o.id}`)
  .dashboard({ icon: 'bi-receipt', color: 'primary' })
  .permissions({
    view: ['admin', 'organizer'],
    create: ['admin'],
    edit: ['admin'],
    delete: ['admin'],
  })
  .searchable('orderNumber', 'email', 'name')
  .defaultSort('createdAt', 'desc')
  .list(list => list
    .columns([
      Column.text('orderNumber').sortable(),
      Column.text('name'),
      Column.belongsTo('event'),
      Column.badge('status', {
        pending: 'warning',
        confirmed: 'success',
        cancelled: 'danger',
        refunded: 'info',
      }),
      Column.badge('paymentStatus', {
        unpaid: 'danger',
        paid: 'success',
        refunded: 'warning',
        partial: 'info',
      }),
      Column.money('total').sortable(),
      Column.date('createdAt').sortable(),
    ])
    .filters([
      Filter.select('status'),
      Filter.belongsTo('event'),
      Filter.dateRange('createdAt').label('Order Date'),
    ])
    .actions([
      Action.make('confirm', 'Confirm Order')
        .icon('bi-check-circle')
        .handler(async (order) => {
          order.status = 'confirmed'
          order.paymentStatus = 'paid'
          await order.save()
          return 'Order confirmed.'
        }),
    ])
    .bulkActions([
      ExportAction.make('export-orders', 'Export Orders')
        .filename('orders-export')
        .columns(['orderNumber', 'name', 'email', 'event', 'status', 'paymentStatus', 'total', 'createdAt'])
        .delimiter(',')
        .dateFormat('YYYY-MM-DD HH:mm')
        .confirm(),
    ])
  )
  .form(form => form
    .sections([
      Section.make('Customer').fields(['name', 'email']).columns(2),
      Section.make('Order Details').fields(['orderNumber', 'event', 'status']).columns(2),
      Section.make('Payment').fields(['paymentStatus', 'subtotal', 'discount', 'total']).columns(2).icon('bi-credit-card'),
    ])
  )
  .detail(detail => detail
    .sections([
      Section.make('Customer').fields(['name', 'email']).columns(2),
      Section.make('Order').fields(['orderNumber', 'event', 'status']).columns(2),
      Section.make('Payment').fields(['paymentStatus', 'subtotal', 'discount', 'total', 'createdAt']).columns(2).icon('bi-credit-card'),
    ])
  )
  .widgets([
    Widget.count('pending-orders', Order.where('status', 'pending'))
      .label('Pending Orders')
      .icon('bi-hourglass-split'),
    Widget.sum('total-revenue', Order, 'total')
      .format('currency', { currency: 'USD' })
      .label('Total Revenue')
      .icon('bi-currency-dollar'),
    Widget.trend('orders-7d', Order, { metric: 'count', bucket: 'day', range: 7 })
      .label('Orders (last 7 days)')
      .icon('bi-graph-up')
      .width('md'),
    Widget.chart('orders-by-status', Order, {
      chart: 'doughnut',
      groupBy: 'status',
      metric: 'count',
    })
      .label('Orders by Status')
      .icon('bi-pie-chart')
      .width('md'),
  ])
