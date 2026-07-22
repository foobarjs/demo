import { test, describe, assert, before, boot } from 'foobarjs/test'
import { _getEM } from 'foobarjs/orm'
import Event from '../app/models/event.model.js'
import TicketType from '../app/models/ticket-type.model.js'
import Order from '../app/models/order.model.js'
import Attendee from '../app/models/attendee.model.js'
import User from '../app/models/user.model.js'

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
      'idx_events_organizer_id',
      'idx_orders_event_id',
      'idx_ticket_types_event_id',
      'idx_attendees_order_id',
      'idx_attendees_ticket_type_id',
      'idx_attendees_event_id',
    ]
    for (const name of expected) {
      assert.ok(names.has(name), `Expected auto-FK index ${name} to exist`)
    }
  })

  test('field-level .index() creates an index', async () => {
    const indexes = await sqliteIndexes()
    const names = new Set(indexes.map(i => i.name))
    // Event.status has .index()
    assert.ok(names.has('idx_events_status'), 'Expected idx_events_status')
    // Order.status has .index()
    assert.ok(names.has('idx_orders_status'), 'Expected idx_orders_status')
  })

  test('static compound indexes are created', async () => {
    const indexes = await sqliteIndexes()
    const names = new Set(indexes.map(i => i.name))
    assert.ok(names.has('idx_events_organizer_id_status'), 'Expected compound events(organizer_id, status)')
    assert.ok(names.has('idx_events_starts_at'), 'Expected events(starts_at)')
  })

  test('unique indexes are created', async () => {
    const indexes = await sqliteIndexes()
    const names = new Set(indexes.map(i => i.name))
    assert.ok(names.has('users_email_unique'))
    assert.ok(names.has('events_slug_unique'))
  })
})

describe('ORM Indexes: Introspection', () => {
  test('Model.getIndexes returns all declared indexes', () => {
    const indexes = Order.getIndexes()
    assert.ok(indexes.length >= 2)
    const bySource = new Map()
    for (const i of indexes) {
      if (!bySource.has(i.source)) bySource.set(i.source, [])
      bySource.get(i.source).push(i)
    }
    assert.ok(bySource.has('field'), 'should have field-level indexes')
    assert.ok(bySource.has('auto-fk'), 'should have auto-FK indexes')
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
    assert.strictEqual(checks[0].name, 'chk_orders_total_nonneg')
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
      () => Order.create({ orderNumber: `chk-${Date.now()}`, email: 'test@test.com', name: 'Test', status: 'pending', total: -100 }),
      /Validation failed|CHECK/i
    )
  })
})

describe('ORM Indexes: Query planner uses indexes', () => {
  before(async () => {
    // Seed some data so the planner has statistics.
    for (let i = 0; i < 3; i++) {
      await Order.create({ orderNumber: `plan-${Date.now()}-${i}`, email: 'test@test.com', name: 'Test', status: 'pending', total: i * 10 })
    }
  })

  test('WHERE on FK column uses idx_orders_event_id', async () => {
    const em = _getEM()
    const conn = em.getConnection()
    const plan = await conn.execute('EXPLAIN QUERY PLAN SELECT * FROM orders WHERE event_id = ?', [1])
    const detail = plan.map(p => p.detail).join(' | ')
    assert.ok(
      /USING\s+(?:INDEX|COVERING\s+INDEX)\s+idx_orders_event_id/i.test(detail),
      `Expected idx_orders_event_id in plan, got: ${detail}`
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
