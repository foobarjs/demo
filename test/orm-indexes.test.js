import { test, describe, assert, before, boot } from 'foobarjs/test'
import { _getEM } from 'foobarjs/orm'
import Product from '../app/models/product.model.js'
import Order from '../app/models/order.model.js'
import User from '../app/models/user.model.js'
import Category from '../app/models/category.model.js'

before(async () => {
  await boot()
})

async function sqliteIndexes() {
  const em = _getEM()
  const conn = em.getConnection()
  const rows = await conn.execute(
    `SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL`
  )
  return rows.map(r => ({ name: r.name, table: r.tbl_name, sql: r.sql }))
}

async function sqliteTableSql(table) {
  const em = _getEM()
  const conn = em.getConnection()
  const rows = await conn.execute(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`,
    [table]
  )
  return rows[0]?.sql || ''
}

describe('ORM Indexes: Auto-FK indexes', () => {
  test('every belongsTo column has a matching auto-FK index', async () => {
    const indexes = await sqliteIndexes()
    const names = new Set(indexes.map(i => i.name))

    // Every belongsTo should have an idx_<table>_<col>_id
    const expected = [
      'idx_orders_user_id',
      'idx_order_items_order_id',
      'idx_order_items_product_id',
      'idx_products_category_id',
      'idx_profiles_user_id',
    ]
    for (const name of expected) {
      assert.ok(names.has(name), `Expected auto-FK index ${name} to exist`)
    }
  })

  test('field-level .index() creates an index', async () => {
    const indexes = await sqliteIndexes()
    const names = new Set(indexes.map(i => i.name))
    // Product.published has .index()
    assert.ok(names.has('idx_products_published'), 'Expected idx_products_published')
    // Order.status has .index()
    assert.ok(names.has('idx_orders_status'), 'Expected idx_orders_status')
  })

  test('static compound indexes are created', async () => {
    const indexes = await sqliteIndexes()
    const names = new Set(indexes.map(i => i.name))
    assert.ok(names.has('idx_orders_user_id_created_at'), 'Expected compound orders(user_id, created_at)')
    assert.ok(names.has('idx_orders_status_recent'), 'Expected named idx_orders_status_recent')
    assert.ok(names.has('idx_products_category_id_published'), 'Expected products(category_id, published)')
  })

  test('unique indexes are created', async () => {
    const indexes = await sqliteIndexes()
    const names = new Set(indexes.map(i => i.name))
    assert.ok(names.has('users_email_unique'))
    assert.ok(names.has('products_slug_unique'))
  })
})

describe('ORM Indexes: Introspection', () => {
  test('Model.getIndexes returns all declared indexes', () => {
    const indexes = Order.getIndexes()
    assert.ok(indexes.length >= 4)
    const bySource = new Map()
    for (const i of indexes) {
      if (!bySource.has(i.source)) bySource.set(i.source, [])
      bySource.get(i.source).push(i)
    }
    assert.ok(bySource.has('field'), 'should have field-level indexes')
    assert.ok(bySource.has('auto-fk'), 'should have auto-FK indexes')
    assert.ok(bySource.has('model'), 'should have static model indexes')
  })

  test('Model.getUniques returns declared uniques', () => {
    const uniques = User.getUniques()
    const emailU = uniques.find(u => u.columns[0] === 'email')
    assert.ok(emailU)
    assert.strictEqual(emailU.unique, true)
  })

  test('Model.getChecks returns declared checks', () => {
    const checks = Order.getChecks()
    assert.strictEqual(checks.length, 1)
    assert.strictEqual(checks[0].name, 'chk_orders_total_nonnegative')
    assert.strictEqual(checks[0].expression, 'total >= 0')
  })
})

describe('ORM Indexes: CHECK constraints', () => {
  test('SQLite table includes CHECK constraint SQL', async () => {
    const sql = await sqliteTableSql('orders')
    assert.ok(/check\s*\(\s*total\s*>=\s*0\s*\)/i.test(sql), `Expected CHECK in table SQL, got: ${sql}`)
  })

  test('CHECK constraint rejects violating inserts', async () => {
    await assert.rejects(
      () => Order.create({ status: 'pending', total: -100 }),
      /Validation failed|CHECK/i
    )
  })
})

describe('ORM Indexes: Query planner uses indexes', () => {
  before(async () => {
    // Seed some data so the planner has statistics.
    for (let i = 0; i < 3; i++) {
      await Order.create({ status: 'pending', total: i * 10 })
    }
  })

  test('WHERE on FK column uses idx_orders_user_id', async () => {
    const em = _getEM()
    const conn = em.getConnection()
    const plan = await conn.execute('EXPLAIN QUERY PLAN SELECT * FROM orders WHERE user_id = ?', [1])
    const detail = plan.map(p => p.detail).join(' | ')
    assert.ok(
      /USING\s+(?:INDEX|COVERING\s+INDEX)\s+idx_orders_user_id/i.test(detail),
      `Expected idx_orders_user_id in plan, got: ${detail}`
    )
  })

  test('WHERE on status column uses idx_orders_status', async () => {
    const em = _getEM()
    const conn = em.getConnection()
    const plan = await conn.execute('EXPLAIN QUERY PLAN SELECT * FROM orders WHERE status = ?', ['pending'])
    const detail = plan.map(p => p.detail).join(' | ')
    // Any status-related index should show up
    assert.ok(
      /USING\s+(?:INDEX|COVERING\s+INDEX)\s+idx_orders_status/i.test(detail),
      `Expected idx_orders_status* in plan, got: ${detail}`
    )
  })
})
