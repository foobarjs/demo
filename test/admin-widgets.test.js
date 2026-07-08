import { test, describe, assert, before, boot } from 'foobarjs/test'
import { Widget, formatValue } from 'foobarjs/admin'
import Order from '../app/models/order.model.js'
import Product from '../app/models/product.model.js'

before(async () => {
  await boot()
})

describe('Admin Widget Factories', () => {
  const suiteTs = Date.now()

  before(async () => {
    await Order.create({ status: 'pending', total: 100 })
    await Order.create({ status: 'shipped', total: 200 })
    await Order.create({ status: 'shipped', total: 300 })
  })

  test('Widget.count runs count() on query', async () => {
    const w = Widget.count('pending', Order.where('status', 'pending'))
    const value = await w._resolver()
    assert.ok(typeof value === 'number')
    assert.ok(value >= 1)
  })

  test('Widget.sum runs sum() on model', async () => {
    const w = Widget.sum('revenue', Order, 'total')
    const value = await w._resolver()
    assert.ok(typeof value === 'number')
    assert.ok(value >= 600)
  })

  test('Widget.avg runs avg() on model', async () => {
    const w = Widget.avg('avg-order', Order, 'total')
    const value = await w._resolver()
    assert.ok(typeof value === 'number')
    assert.ok(value > 0)
  })

  test('Widget.min runs min() on model', async () => {
    const w = Widget.min('min-order', Order, 'total')
    const value = await w._resolver()
    assert.ok(typeof value === 'number')
  })

  test('Widget.max runs max() on model', async () => {
    const w = Widget.max('max-order', Order, 'total')
    const value = await w._resolver()
    assert.ok(typeof value === 'number')
  })

  test('Widget.exists returns boolean', async () => {
    const w = Widget.exists('has-shipped', Order.where('status', 'shipped'))
    const value = await w._resolver()
    assert.strictEqual(typeof value, 'boolean')
    assert.strictEqual(value, true)
  })

  test('Widget.trend returns series + labels + value', async () => {
    const w = Widget.trend('orders-30d', Order, {
      metric: 'count',
      bucket: 'day',
      range: 7,
    })
    const value = await w._resolver()
    assert.ok(value.series)
    assert.ok(Array.isArray(value.series))
    assert.strictEqual(value.series.length, 7)
    assert.ok(Array.isArray(value.labels))
    assert.strictEqual(value.labels.length, 7)
  })

  test('Widget.chart groupBy returns categorical data', async () => {
    const w = Widget.chart('by-status', Order, {
      chart: 'doughnut',
      groupBy: 'status',
      metric: 'count',
    })
    const value = await w._resolver()
    assert.strictEqual(value.chart, 'doughnut')
    assert.ok(Array.isArray(value.labels))
    assert.ok(Array.isArray(value.series))
    assert.strictEqual(value.labels.length, value.series.length)
    assert.ok(value.labels.length >= 2)
  })

  test('Widget.chart bucketed returns time series', async () => {
    const w = Widget.chart('rev-day', Order, {
      chart: 'line',
      bucket: 'day',
      range: 7,
      metric: 'sum',
      column: 'total',
    })
    const value = await w._resolver()
    assert.strictEqual(value.chart, 'line')
    assert.strictEqual(value.labels.length, 7)
    assert.strictEqual(value.series.length, 7)
  })

  test('Widget.format applies formatting to displayValue', async () => {
    const w = Widget.sum('rev-fmt', Order, 'total').format('currency', { currency: 'USD' })
    assert.strictEqual(w._format, 'currency')
    assert.deepStrictEqual(w._formatOptions, { currency: 'USD' })
  })

  test('formatValue formats numbers', () => {
    assert.strictEqual(formatValue(1234, 'number'), '1,234')
    assert.strictEqual(formatValue(1234.56, 'currency', { currency: 'USD' }), '$1,234.56')
    assert.strictEqual(formatValue(50, 'percent'), '50%')
    assert.strictEqual(formatValue(0.5, 'percent', { fromRatio: true }), '50%')
    assert.strictEqual(formatValue(1024, 'bytes'), '1.00 KB')
  })

  test('Widget.width and Widget.order chainable', () => {
    const w = Widget.count('x', Order).width('lg').order(5)
    assert.strictEqual(w._width, 'lg')
    assert.strictEqual(w._order, 5)
  })

  test('Widget resolver receives context', async () => {
    const w = Widget.value('ctx', (ctx) => (ctx?.user ? 'user' : 'anon'))
    const value = await w._resolver({ user: { id: 1 } })
    assert.strictEqual(value, 'user')
  })

  test('Widget.count with function that returns query gets context', async () => {
    const w = Widget.count('dyn', (ctx) => Order.query())
    const value = await w._resolver({ user: null })
    assert.ok(typeof value === 'number')
  })
})
