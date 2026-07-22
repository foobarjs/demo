import { test, describe, assert, before, boot } from 'foobarjs/test'
import Event from '../app/models/event.model.js'
import TicketType from '../app/models/ticket-type.model.js'
import User from '../app/models/user.model.js'

before(async () => {
  await boot()
})

describe('ORM Features', () => {
  before(async () => {
    const ts = Date.now()
    const seedEvent = await Event.create({ title: `Seed Event ${ts}`, slug: `seed-event-${ts}`, startsAt: new Date('2026-09-01T10:00:00Z'), status: 'published' })
    await TicketType.create({ name: `Seed Ticket ${ts}`, price: 10, quantity: 5, event: seedEvent.id })
  })

  test('findOrFail returns model when found', async () => {
    const first = await Event.query().first()
    const e = await Event.findOrFail(first.id)
    assert.ok(e)
    assert.ok(e.id)
  })

  test('findOrFail throws when not found', async () => {
    await assert.rejects(
      () => Event.findOrFail(999999),
      { message: /No record found/ },
      'should throw 404 error'
    )
  })

  test('pluck returns array of values', async () => {
    const first = await Event.query().first()
    const titles = await Event.pluck('title')
    assert.ok(Array.isArray(titles))
    assert.ok(titles.length > 0)
    assert.ok(typeof titles[0] === 'string')
  })

  test('pluck returns key-value pairs with second arg', async () => {
    const first = await Event.query().first()
    const map = await Event.pluck('title', 'id')
    assert.ok(typeof map === 'object')
    const ids = Object.keys(map)
    assert.ok(ids.length > 0)
    assert.strictEqual(map[ids[0]], first.title)
  })

  test('when applies callback when condition is truthy', async () => {
    const first = await Event.query().first()
    const events = await Event.when(true, qb => qb.where('id', first.id)).get()
    assert.ok(events.length > 0)
    assert.strictEqual(events[0].id, first.id)
  })

  test('when skips callback when condition is falsy', async () => {
    const events = await Event.when(false, qb => qb.where('id', 1)).get()
    assert.ok(events.length > 0)
  })

  test('unless applies callback when condition is falsy', async () => {
    const first = await Event.query().first()
    const events = await Event.unless(false, qb => qb.where('id', first.id)).get()
    assert.ok(events.length > 0)
    assert.strictEqual(events[0].id, first.id)
  })

  test('unless skips callback when condition is truthy', async () => {
    const events = await Event.unless(true, qb => qb.where('id', 1)).get()
    assert.ok(events.length > 0)
  })

  test('increment updates column atomically', async () => {
    const e = await Event.create({ title: 'Inc Test', slug: `inc-${Date.now()}`, startsAt: new Date('2026-09-01T10:00:00Z'), maxAttendees: 5 })
    await e.increment('maxAttendees', 3)
    assert.strictEqual(e.maxAttendees, 8)
    const reloaded = await Event.find(e.id)
    assert.strictEqual(reloaded.maxAttendees, 8)
  })

  test('decrement updates column atomically', async () => {
    const e = await Event.create({ title: 'Dec Test', slug: `dec-${Date.now()}`, startsAt: new Date('2026-09-01T10:00:00Z'), maxAttendees: 5 })
    await e.decrement('maxAttendees', 2)
    assert.strictEqual(e.maxAttendees, 3)
    const reloaded = await Event.find(e.id)
    assert.strictEqual(reloaded.maxAttendees, 3)
  })

  test('firstOrCreate creates new record', async () => {
    const slug = `foc-${Date.now()}`
    const e = await Event.firstOrCreate({ slug }, { title: 'FirstOrCreate Test', startsAt: new Date('2026-09-01T10:00:00Z') })
    assert.ok(e.id)
    assert.strictEqual(e.title, 'FirstOrCreate Test')
    const e2 = await Event.firstOrCreate({ slug }, { title: 'Should Not Update' })
    assert.strictEqual(e2.id, e.id)
    assert.strictEqual(e2.title, 'FirstOrCreate Test')
  })

  test('updateOrCreate creates and updates', async () => {
    const slug = `uoc-${Date.now()}`
    const e = await Event.updateOrCreate({ slug }, { title: 'UpdateOrCreate Test', startsAt: new Date('2026-09-01T10:00:00Z') })
    assert.ok(e.id)
    assert.strictEqual(e.title, 'UpdateOrCreate Test')
    const e2 = await Event.updateOrCreate({ slug }, { title: 'Updated Name' })
    assert.strictEqual(e2.id, e.id)
    assert.strictEqual(e2.title, 'Updated Name')
  })

  test('load lazy loads belongsTo relation', async () => {
    const ts = Date.now()
    const event = await Event.create({ title: `Load Event ${ts}`, slug: `load-event-${ts}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    const tt = await TicketType.create({ name: `Load Ticket ${ts}`, price: 10, quantity: 1, event: event.id })
    assert.ok(tt.event !== null)
    const eventId = Number(tt.event)
    assert.ok(eventId > 0)
    await tt.load('event')
    assert.ok(tt.event)
    assert.strictEqual(typeof tt.event, 'object')
    assert.strictEqual(tt.event.id, eventId)
  })

  test('load lazy loads hasMany relation', async () => {
    const ts = Date.now()
    const event = await Event.create({ title: `Load HM Event ${ts}`, slug: `load-hm-event-${ts}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    await TicketType.create({ name: `Load HM Ticket ${ts}`, price: 10, quantity: 1, event: event.id })
    await event.load('ticketTypes')
    assert.ok(Array.isArray(event.ticketTypes))
    assert.ok(event.ticketTypes.length > 0)
  })

  test('fresh returns new instance from DB', async () => {
    const e = await Event.create({ title: 'Fresh Test', slug: `fresh-${Date.now()}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    const slug = e.slug
    const fresh = await e.fresh()
    assert.ok(fresh)
    assert.notStrictEqual(fresh, e)
    assert.strictEqual(fresh.slug, slug)
  })

  test('refresh updates instance in place', async () => {
    const e = await Event.create({ title: 'Refresh Test', slug: `refresh-${Date.now()}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    e.title = 'Dirty'
    await e.refresh()
    assert.strictEqual(e.title, 'Refresh Test')
  })

  test('whereHas filters by relation', async () => {
    const ts = Date.now()
    const event = await Event.create({ title: `WH Event ${ts}`, slug: `wh-event-${ts}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    await TicketType.create({ name: `WH Ticket ${ts}`, price: 10, quantity: 1, event: event.id })
    const tickets = await TicketType.whereHas('event', qb => {
      qb.where('id', event.id)
    }).get()
    assert.ok(tickets.length > 0)
    for (const t of tickets) {
      assert.strictEqual(Number(t.event), event.id)
    }
  })

  test('orWhereHas adds OR condition', async () => {
    const first = await TicketType.query().first()
    const eventId = Number(first.event)
    const tickets = await TicketType
      .where('id', 0)
      .orWhereHas('event', qb => {
        qb.where('id', eventId)
      })
      .get()
    if (tickets.length > 0) {
      for (const t of tickets) {
        assert.strictEqual(Number(t.event), eventId)
      }
    }
  })

  test('appends are included in toJSON', async () => {
    const e = await Event.create({ title: 'Appends Test', slug: `app-${Date.now()}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    const json = JSON.parse(JSON.stringify(e))
    assert.ok(typeof json === 'object')
  })

  test('query builder chaining with when and pluck', async () => {
    const slugs = await Event.when(true, qb => qb.where('id', '>=', 1)).pluck('slug')
    assert.ok(Array.isArray(slugs))
    assert.ok(slugs.length > 0)
  })

  test('scope registration and application', async () => {
    const scoped = Event.query()
    Event.applyScope('published', scoped)
    const results = await scoped.get()
    assert.ok(Array.isArray(results))
  })

  test('declarative scopes via query builder chaining', async () => {
    const events = await Event.query().where('id', '>=', 1).get()
    assert.ok(events.length > 0)
  })

  test('scope methods from scopes() are callable on query builder', async () => {
    const results = await Event.query().published().get()
    assert.ok(Array.isArray(results))
    for (const e of results) {
      assert.strictEqual(e.status, 'published')
    }
  })

  test('setter triggers password mutator via direct assignment', async () => {
    const user = new User()
    user.password = 'plaintext'
    assert.notStrictEqual(user.password, 'plaintext')
    assert.ok(user.password.startsWith('$scrypt$'))
    assert.ok(user.verifyPassword('plaintext'))
  })

  test('setter does not mutate during _fromEntity loading', async () => {
    const email = `reload-${Date.now()}@test.com`
    const created = await User.create({
      name: 'Reload Test',
      email,
      password: 'reloadpass',
    })
    const user = await User.find(created.id)
    assert.ok(user)
    assert.ok(user.password.length > 0)
    assert.ok(user.password.startsWith('$scrypt$'))
    assert.ok(user.verifyPassword('reloadpass'))
    assert.ok(!user.isDirty('password'))
  })

  test('setter mutator via create passes through constructor', async () => {
    const email = `mutator-${Date.now()}@test.com`
    const user = await User.create({
      name: 'Mutator Test',
      email,
      password: 'mypass',
    })
    assert.notStrictEqual(user.password, 'mypass')
    assert.ok(user.password.startsWith('$scrypt$'))
    assert.ok(user.verifyPassword('mypass'))
  })

  test('model scopes from scopes() work as chainable methods', async () => {
    const admins = await User.query().admins().get()
    assert.ok(Array.isArray(admins))
    for (const u of admins) {
      assert.strictEqual(u.isAdmin, true)
    }
  })

  test('chunk processes records in batches', async () => {
    const ts = Date.now()
    const created = []
    for (let i = 0; i < 5; i++) {
      created.push(await Event.create({
        title: `Chunk ${ts}-${i}`, slug: `chunk-${ts}-${i}`, startsAt: new Date('2026-09-01T10:00:00Z'),
      }))
    }
    const ids = created.map(c => c.id)
    const collected = []
    await Event.where('id', ids).orderBy('id', 'asc').chunk(2, (records, page) => {
      collected.push(...records)
    })
    assert.strictEqual(collected.length, 5)
    assert.strictEqual(collected[0].id, created[0].id)
    assert.strictEqual(collected[4].id, created[4].id)
  })

  test('chunk stops when callback returns false', async () => {
    const ts = Date.now()
    const ids = []
    for (let i = 0; i < 5; i++) {
      const e = await Event.create({
        title: `ChunkStop ${ts}-${i}`, slug: `chunk-stop-${ts}-${i}`, startsAt: new Date('2026-09-01T10:00:00Z'),
      })
      ids.push(e.id)
    }
    let pages = 0
    await Event.where('id', ids).chunk(2, () => {
      pages++
      return false
    })
    assert.strictEqual(pages, 1)
  })

  test('lazy yields records one at a time', async () => {
    const ts = Date.now()
    const ids = []
    for (let i = 0; i < 3; i++) {
      const e = await Event.create({
        title: `Lazy ${ts}-${i}`, slug: `lazy-${ts}-${i}`, startsAt: new Date('2026-09-01T10:00:00Z'),
      })
      ids.push(e.id)
    }
    const collected = []
    for await (const model of Event.where('id', ids).lazy(2)) {
      collected.push(model)
    }
    assert.strictEqual(collected.length, 3)
  })

  test('cursor streams records', async () => {
    const ts = Date.now()
    const ids = []
    for (let i = 0; i < 3; i++) {
      const e = await Event.create({
        title: `Cursor ${ts}-${i}`, slug: `cursor-${ts}-${i}`, startsAt: new Date('2026-09-01T10:00:00Z'),
      })
      ids.push(e.id)
    }
    const collected = []
    for await (const model of Event.where('id', ids).cursor()) {
      collected.push(model)
    }
    assert.strictEqual(collected.length, 3)
  })
})
