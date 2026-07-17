import { Admin, Action, ExportAction, Column, Filter, Section, Widget } from 'foobarjs/admin'
import Order from '../models/order.model.js'

export default Admin.resource(Order)
  .label('Orders', 'Order')
  .icon('bi-cart')
  .group('Sales')
  .displayLabel(o => `Order #${o.id}`)
  .dashboard({ icon: 'bi-cart', color: 'primary' })
  .beforeStore(async ({ data }) => {
    if (!data.status) data.status = 'pending'
  })
  .afterStore(async ({ item }) => {
    console.log(`[hook] Order #${item.id} created with status ${item.status}`)
  })
  .permissions({
    view: ['admin', 'editor'],
    create: ['admin'],
    edit: ['admin', 'editor'],
    delete: ['admin'],
  })
  .searchable('status', 'shippingAddress')
  .defaultSort('createdAt', 'desc')
  .list(list => list
    .autoFilters(true)
    .columns([
      Column.text('id').sortable(),
      Column.belongsTo('user'),
      Column.badge('status', {
        pending: 'warning',
        processing: 'info',
        shipped: 'primary',
        delivered: 'success',
        cancelled: 'danger',
      }),
      Column.money('total').sortable(),
      Column.date('paidAt'),
    ])
    .actions([
      Action.make('ship', 'Mark as shipped')
        .icon('bi-truck')
        .variant('primary')
        .handler(async (order) => {
          order.status = 'shipped'
          await order.save()
          return 'Order marked as shipped.'
        }),
    ])
    
    .filters([
      Filter.select('status'),
      Filter.belongsTo('user'),
    ])

    .bulkActions([
      ExportAction.make('export-orders', 'Export Orders')
        .filename('orders-export')
        .columns(['id', 'status', 'total', 'shippingAddress', 'paidAt', { 'QR': (record) => `https://qr.example.com/${record.id}` }])
        .delimiter(',')
        .dateFormat('YYYY-MM-DD HH:mm')
        .confirm()
    ])
   
  )
  
  .form(form => form
    .sections([
      Section.make('Customer & Status').fields(['user', 'status']).columns(2),
      Section.make('Payment').fields(['total', 'paidAt']).columns(2),
      Section.make('Shipping').fields(['shippingAddress']),
    ])
  )
  .detail(detail => detail
    .fields(['id', 'user', 'status', 'total', 'paidAt', 'shippingAddress', 'createdAt'])
    .sections([
      Section.make('Overview').fields(['id', 'user', 'status']).columns(2),
      Section.make('Payment').fields(['total', 'paidAt']).columns(2).icon('bi-cash-coin'),
      Section.make('Shipping').fields(['shippingAddress']).icon('bi-truck'),
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
    Widget.chart('revenue-30d', Order, {
      chart: 'line',
      bucket: 'day',
      range: 30,
      metric: 'sum',
      column: 'total',
    })
      .label('Revenue (last 30 days)')
      .icon('bi-graph-up-arrow')
      .width('lg'),
  ])
