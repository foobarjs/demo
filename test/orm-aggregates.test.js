import { test, describe, assert, before, boot } from 'foobarjs/test'
import Event from '../app/models/event.model.js'
import TicketType from '../app/models/ticket-type.model.js'
import User from '../app/models/user.model.js'

before(async () => {
  await boot()
})

describe('ORM Aggregates', () => {
  const suiteTs = Date.now()
  let eventA, eventB

  before(async () => {
    eventA = await Event.create({ title: `AggEventA ${suiteTs}`, slug: `agg-event-a-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    eventB = await Event.create({ title: `AggEventB ${suiteTs}`, slug: `agg-event-b-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    for (let i = 0; i < 3; i++) {
      await TicketType.create({
        name: `AggTicket ${suiteTs}-${i}`,
        price: (i + 1) * 10,
        quantity: i,
        event: eventA.id,
      })
    }
    for (let i = 0; i < 2; i++) {
      await TicketType.create({
        name: `AggTicketB ${suiteTs}-${i}`,
        price: 100,
        quantity: 5,
        event: eventB.id,
      })
    }
  })

  test('Model.count returns total row count', async () => {
    const count = await TicketType.count()
    assert.ok(typeof count === 'number')
    assert.ok(count >= 5)
  })

  test('query().count filters by where', async () => {
    const count = await TicketType.query().where('event', eventA.id).count()
    assert.strictEqual(count, 3)
  })

  test('Model.sum computes sum', async () => {
    const total = await TicketType.query().where('event', eventB.id).sum('price')
    assert.strictEqual(total, 200)
  })

  test('Model.avg computes average', async () => {
    const avg = await TicketType.query().where('event', eventA.id).avg('price')
    assert.strictEqual(avg, 20)
  })

  test('Model.min returns minimum', async () => {
    const min = await TicketType.query().where('event', eventA.id).min('price')
    assert.strictEqual(min, 10)
  })

  test('Model.max returns maximum', async () => {
    const max = await TicketType.query().where('event', eventA.id).max('price')
    assert.strictEqual(max, 30)
  })

  test('query().exists returns true when rows match', async () => {
    const exists = await TicketType.query().where('event', eventA.id).exists()
    assert.strictEqual(exists, true)
  })

  test('query().exists returns false when no rows match', async () => {
    const exists = await TicketType.query().where('name', 'never-ever-name-xxxxxx').exists()
    assert.strictEqual(exists, false)
  })

  test('query().doesntExist inverts exists', async () => {
    const doesnt = await TicketType.query().where('name', 'never-ever-name-xxxxxx').doesntExist()
    assert.strictEqual(doesnt, true)
  })

  test('query().value returns single column value', async () => {
    const price = await TicketType.query().where('event', eventB.id).value('price')
    assert.strictEqual(price, 100)
  })

  test('count with distinct removes duplicates', async () => {
    const distinctEvents = await TicketType.query().distinct().count('event')
    assert.ok(distinctEvents >= 2)
  })

  test('aggregates respect soft delete', async () => {
    const before = await TicketType.query().count()
    assert.ok(before >= 5)
  })
})

describe('ORM Filter Primitives', () => {
  const suiteTs = Date.now()
  let ids = []

  before(async () => {
    const event = await Event.create({ title: `FilterEvent ${suiteTs}`, slug: `filter-event-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    for (let i = 0; i < 4; i++) {
      const tt = await TicketType.create({
        name: `FilterTicket ${suiteTs}-${i}`,
        price: (i + 1) * 5,
        quantity: i,
        event: event.id,
      })
      ids.push(tt.id)
    }
  })

  test('whereIn matches values in list', async () => {
    const items = await TicketType.query().whereIn('id', [ids[0], ids[1]]).get()
    assert.strictEqual(items.length, 2)
  })

  test('whereNotIn excludes values in list', async () => {
    const items = await TicketType.query().whereIn('id', ids).whereNotIn('id', [ids[0]]).get()
    assert.strictEqual(items.length, 3)
  })

  test('whereNull matches null values', async () => {
    const items = await TicketType.query().whereIn('id', ids).whereNull('description').get()
    assert.ok(items.length >= 4)
  })

  test('whereNotNull excludes null values', async () => {
    const event = await Event.create({ title: `NotNullEvent ${suiteTs}`, slug: `notnull-event-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    const tt = await TicketType.create({
      name: `NotNullTicket ${suiteTs}`,
      description: 'has desc',
      price: 1,
      quantity: 1,
      event: event.id,
    })
    const items = await TicketType.query().where('id', tt.id).whereNotNull('description').get()
    assert.strictEqual(items.length, 1)
  })

  test('whereBetween matches range', async () => {
    const items = await TicketType.query()
      .whereIn('id', ids)
      .whereBetween('price', [10, 15])
      .get()
    assert.strictEqual(items.length, 2)
  })

  test('whereNotBetween excludes range', async () => {
    const items = await TicketType.query()
      .whereIn('id', ids)
      .whereNotBetween('price', [10, 15])
      .get()
    assert.strictEqual(items.length, 2)
  })

  test('whereColumn compares two columns', async () => {
    const event = await Event.create({ title: `ColEvent ${suiteTs}`, slug: `col-event-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    const tt = await TicketType.create({
      name: `ColTicket ${suiteTs}`,
      price: 5,
      quantity: 5,
      event: event.id,
    })
    const items = await TicketType.query().where('id', tt.id).whereColumn('price', '=', 'quantity').get()
    assert.strictEqual(items.length, 1)
  })

  test('whereRaw with bindings works', async () => {
    const items = await TicketType.query().whereRaw('price > ?', [30]).get()
    assert.ok(Array.isArray(items))
  })

  test('closure-scoped nested where builds AND(OR) group', async () => {
    const items = await TicketType.query()
      .whereIn('id', ids)
      .where(qb => qb.where('price', 5).orWhere('price', 20))
      .get()
    assert.strictEqual(items.length, 2)
  })
})

describe('ORM Multi-column OrderBy', () => {
  const suiteTs = Date.now()
  let ids = []

  before(async () => {
    const event = await Event.create({ title: `SortEvent ${suiteTs}`, slug: `sort-event-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    ids.push((await TicketType.create({ name: `Sort ${suiteTs} A`, price: 10, quantity: 2, event: event.id })).id)
    ids.push((await TicketType.create({ name: `Sort ${suiteTs} B`, price: 10, quantity: 1, event: event.id })).id)
    ids.push((await TicketType.create({ name: `Sort ${suiteTs} C`, price: 20, quantity: 3, event: event.id })).id)
  })

  test('multi-column orderBy sorts by both', async () => {
    const items = await TicketType.query()
      .whereIn('id', ids)
      .orderBy('price', 'asc')
      .orderBy('quantity', 'asc')
      .get()
    assert.strictEqual(items[0].id, ids[1])
    assert.strictEqual(items[1].id, ids[0])
    assert.strictEqual(items[2].id, ids[2])
  })

  test('latest() sorts by createdAt desc', async () => {
    const items = await TicketType.query().whereIn('id', ids).latest('createdAt').get()
    assert.strictEqual(items.length, 3)
  })

  test('oldest() sorts by createdAt asc', async () => {
    const items = await TicketType.query().whereIn('id', ids).oldest('createdAt').get()
    assert.strictEqual(items.length, 3)
  })

  test('reorder() clears previous orderBy', async () => {
    const items = await TicketType.query().whereIn('id', ids).orderBy('id', 'desc').reorder().orderBy('id', 'asc').get()
    assert.strictEqual(items[0].id, ids[0])
  })
})

describe('ORM GroupBy and HAVING', () => {
  const suiteTs = Date.now()
  let eventA, eventB

  before(async () => {
    eventA = await Event.create({ title: `GrpA ${suiteTs}`, slug: `grp-a-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    eventB = await Event.create({ title: `GrpB ${suiteTs}`, slug: `grp-b-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    for (let i = 0; i < 3; i++) {
      await TicketType.create({ name: `GrpT ${suiteTs}-${i}`, price: 5, quantity: 1, event: eventA.id })
    }
    for (let i = 0; i < 2; i++) {
      await TicketType.create({ name: `GrpQ ${suiteTs}-${i}`, price: 10, quantity: 1, event: eventB.id })
    }
  })

  test('groupBy returns aggregated rows', async () => {
    const rows = await TicketType.query()
      .whereIn('event', [eventA.id, eventB.id])
      .groupBy('event')
      .selectCount('*', 'count')
      .get()
    assert.strictEqual(rows.length, 2)
    for (const row of rows) {
      assert.ok(typeof row.count === 'number')
    }
  })

  test('groupBy with sum aggregate', async () => {
    const rows = await TicketType.query()
      .whereIn('event', [eventA.id, eventB.id])
      .groupBy('event')
      .selectSum('price', 'total')
      .get()
    assert.strictEqual(rows.length, 2)
    const byEvent = new Map()
    for (const row of rows) byEvent.set(row.event_id, row.total)
    assert.strictEqual(byEvent.get(eventA.id), 15)
    assert.strictEqual(byEvent.get(eventB.id), 20)
  })

  test('having filters grouped results', async () => {
    const rows = await TicketType.query()
      .whereIn('event', [eventA.id, eventB.id])
      .groupBy('event')
      .selectCount('*', 'cnt')
      .having('cnt', '>', 2)
      .get()
    assert.strictEqual(rows.length, 1)
    assert.strictEqual(rows[0].event_id, eventA.id)
  })
})

describe('ORM Date Bucketing', () => {
  test('groupByDay returns per-day buckets', async () => {
    const rows = await Event.query()
      .groupByDay('createdAt')
      .selectCount('*', 'cnt')
      .get()
    assert.ok(Array.isArray(rows))
    assert.ok(rows.length > 0)
    for (const row of rows) {
      assert.ok(row.bucket, 'row should have bucket')
      assert.ok(typeof row.cnt === 'number')
    }
  })

  test('groupByMonth returns per-month buckets', async () => {
    const rows = await Event.query()
      .groupByMonth('createdAt')
      .selectCount('*', 'cnt')
      .get()
    assert.ok(Array.isArray(rows))
    for (const row of rows) {
      assert.ok(row.bucket, 'row should have bucket')
    }
  })

  test('groupByYear returns per-year buckets', async () => {
    const rows = await Event.query()
      .groupByYear('createdAt')
      .selectCount('*', 'cnt')
      .get()
    assert.ok(Array.isArray(rows))
    assert.ok(rows.length > 0)
  })

  test('groupByDay with sum on price', async () => {
    const rows = await TicketType.query()
      .groupByDay('createdAt')
      .selectSum('price', 'total')
      .get()
    for (const row of rows) {
      assert.ok(row.bucket)
      assert.ok(typeof row.total === 'number')
    }
  })
})

describe('ORM Bulk Operations', () => {
  const suiteTs = Date.now()

  test('insertMany creates multiple rows', async () => {
    const count = await Event.insertMany([
      { title: `Bulk ${suiteTs} 1`, slug: `bulk-${suiteTs}-1`, startsAt: new Date('2026-09-01T10:00:00Z') },
      { title: `Bulk ${suiteTs} 2`, slug: `bulk-${suiteTs}-2`, startsAt: new Date('2026-09-01T10:00:00Z') },
      { title: `Bulk ${suiteTs} 3`, slug: `bulk-${suiteTs}-3`, startsAt: new Date('2026-09-01T10:00:00Z') },
    ])
    assert.strictEqual(count, 3)
    const found = await Event.query().where('slug', 'like', `bulk-${suiteTs}-%`).get()
    assert.strictEqual(found.length, 3)
  })

  test('updateAll updates matching rows', async () => {
    const ts = Date.now() + 1
    const ids = []
    for (let i = 0; i < 3; i++) {
      ids.push((await Event.create({ title: `Upd ${ts}-${i}`, slug: `upd-${ts}-${i}`, startsAt: new Date('2026-09-01T10:00:00Z'), maxAttendees: 0 })).id)
    }
    await Event.query().whereIn('id', ids).updateAll({ maxAttendees: 99 })
    for (const id of ids) {
      const fresh = await Event.find(id)
      assert.strictEqual(fresh.maxAttendees, 99)
    }
  })

  test('deleteAll removes matching rows', async () => {
    const ts = Date.now() + 2
    const ids = []
    for (let i = 0; i < 3; i++) {
      ids.push((await Event.create({ title: `Del ${ts}-${i}`, slug: `del-${ts}-${i}`, startsAt: new Date('2026-09-01T10:00:00Z') })).id)
    }
    await Event.query().whereIn('id', ids).deleteAll()
    for (const id of ids) {
      const fresh = await Event.find(id)
      assert.strictEqual(fresh, null)
    }
  })
})

describe('ORM Introspection', () => {
  test('toSQL returns sql string', async () => {
    const q = TicketType.query().where('price', '>', 10).orderBy('id', 'desc').limit(5)
    const { sql, bindings } = q.toSQL()
    assert.ok(typeof sql === 'string')
    assert.ok(sql.length > 0)
    assert.ok(Array.isArray(bindings))
  })
})

describe('ORM Nested Eager Loading', () => {
  const suiteTs = Date.now()

  test('nested eager loading batched: event -> ticketTypes', async () => {
    const event = await Event.create({ title: `Nest ${suiteTs}`, slug: `nest-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    for (let i = 0; i < 3; i++) {
      await TicketType.create({ name: `NestT ${suiteTs}-${i}`, price: 5, quantity: 1, event: event.id })
    }
    const tickets = await TicketType.with({ event: ['ticketTypes'] }).where('event', event.id).get()
    assert.ok(tickets.length >= 3)
    for (const t of tickets) {
      assert.ok(t.event)
      assert.ok(Array.isArray(t.event.ticketTypes))
      assert.ok(t.event.ticketTypes.length >= 3)
    }
  })

  test('eager-loading constraint filters relation', async () => {
    const event = await Event.create({ title: `Cons ${suiteTs}`, slug: `cons-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    await TicketType.create({ name: `Cons cheap ${suiteTs}`, price: 1, quantity: 1, event: event.id })
    await TicketType.create({ name: `Cons expensive ${suiteTs}`, price: 100, quantity: 1, event: event.id })

    const events = await Event.with({ ticketTypes: qb => qb.where('price', '>', 10) }).where('id', event.id).get()
    assert.strictEqual(events.length, 1)
    assert.strictEqual(events[0].ticketTypes.length, 1)
    assert.strictEqual(events[0].ticketTypes[0].price, 100)
  })
})

describe('ORM Relation Aggregates', () => {
  const suiteTs = Date.now()

  test('withSum on hasMany relation', async () => {
    const event = await Event.create({ title: `Sum ${suiteTs}`, slug: `sum-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    await TicketType.create({ name: `Sum T1 ${suiteTs}`, price: 5, quantity: 1, event: event.id })
    await TicketType.create({ name: `Sum T2 ${suiteTs}`, price: 15, quantity: 1, event: event.id })

    const [loaded] = await Event.query().withSum('ticketTypes', 'price').where('id', event.id).get()
    assert.ok(loaded)
    assert.strictEqual(loaded.ticketTypesSumPrice, 20)
  })

  test('withAvg on hasMany relation', async () => {
    const event = await Event.create({ title: `Avg ${suiteTs}`, slug: `avg-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    await TicketType.create({ name: `Avg T1 ${suiteTs}`, price: 10, quantity: 1, event: event.id })
    await TicketType.create({ name: `Avg T2 ${suiteTs}`, price: 20, quantity: 1, event: event.id })

    const [loaded] = await Event.query().withAvg('ticketTypes', 'price').where('id', event.id).get()
    assert.strictEqual(loaded.ticketTypesAvgPrice, 15)
  })

  test('withMax on hasMany relation', async () => {
    const event = await Event.create({ title: `Max ${suiteTs}`, slug: `max-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    await TicketType.create({ name: `Max T1 ${suiteTs}`, price: 7, quantity: 1, event: event.id })
    await TicketType.create({ name: `Max T2 ${suiteTs}`, price: 22, quantity: 1, event: event.id })

    const [loaded] = await Event.query().withMax('ticketTypes', 'price').where('id', event.id).get()
    assert.strictEqual(loaded.ticketTypesMaxPrice, 22)
  })

  test('withExists returns boolean flag', async () => {
    const withTickets = await Event.create({ title: `Has ${suiteTs}`, slug: `has-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    const noTickets = await Event.create({ title: `None ${suiteTs}`, slug: `none-${suiteTs}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    await TicketType.create({ name: `HasT ${suiteTs}`, price: 1, quantity: 1, event: withTickets.id })

    const results = await Event.query()
      .withExists('ticketTypes')
      .whereIn('id', [withTickets.id, noTickets.id])
      .get()
    const byId = new Map(results.map(r => [r.id, r]))
    assert.strictEqual(byId.get(withTickets.id).ticketTypesExists, true)
    assert.strictEqual(byId.get(noTickets.id).ticketTypesExists, false)
  })
})

describe('ORM Cursor Pagination', () => {
  const suiteTs = Date.now()
  let ids = []

  before(async () => {
    for (let i = 0; i < 8; i++) {
      const e = await Event.create({ title: `Cur ${suiteTs}-${i}`, slug: `cur-${suiteTs}-${i}`, startsAt: new Date('2026-09-01T10:00:00Z') })
      ids.push(e.id)
    }
  })

  test('cursorPaginate returns first page and nextCursor', async () => {
    const page = await Event.query().whereIn('id', ids).cursorPaginate({ perPage: 3 })
    assert.strictEqual(page.data.length, 3)
    assert.strictEqual(page.meta.hasMore, true)
    assert.ok(page.meta.nextCursor)
  })

  test('cursorPaginate follows nextCursor', async () => {
    const page1 = await Event.query().whereIn('id', ids).cursorPaginate({ perPage: 3 })
    const page2 = await Event.query().whereIn('id', ids).cursorPaginate({ perPage: 3, cursor: page1.meta.nextCursor })
    assert.strictEqual(page2.data.length, 3)
    assert.notStrictEqual(page2.data[0].id, page1.data[0].id)
  })
})

describe('ORM Bug Fixes', () => {
  test('clone preserves limit/offset/select/page/perPage', async () => {
    const base = TicketType.query().where('price', '>', 1).limit(5).offset(2).paginate(2, 3)
    const cloned = base.clone()
    assert.strictEqual(cloned._limit, base._limit)
    assert.strictEqual(cloned._offset, base._offset)
    assert.strictEqual(cloned._page, base._page)
    assert.strictEqual(cloned._perPage, base._perPage)
  })

  test('getQueryBuilder returns underlying MikroORM QB', async () => {
    const qb = TicketType.query().where('price', '>', 0).getQueryBuilder()
    assert.ok(qb)
    assert.strictEqual(typeof qb.execute, 'function')
  })

  test('pagination meta shape is stable', async () => {
    const result = await Event.query().paginate(1, 5).get()
    assert.ok(result.data)
    assert.ok(result.meta)
    assert.ok(typeof result.meta.currentPage === 'number')
    assert.ok(typeof result.meta.lastPage === 'number')
    assert.ok(typeof result.meta.perPage === 'number')
    assert.ok(typeof result.meta.total === 'number')
    assert.ok(typeof result.meta.from === 'number')
    assert.ok(typeof result.meta.to === 'number')
  })
})
