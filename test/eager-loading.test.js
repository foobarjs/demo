import { test, describe, assert, before, boot } from 'foobarjs/test'
import Event from '../app/models/event.model.js'
import TicketType from '../app/models/ticket-type.model.js'
import DiscountCode from '../app/models/discount-code.model.js'
import User from '../app/models/user.model.js'

before(async () => {
  await boot()
})

describe('Eager Loading', () => {
  test('loads belongsTo relation in batch', async () => {
    const ts = Date.now()
    const event = await Event.create({ title: `EL Event ${ts}`, slug: `el-event-${ts}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    for (let i = 0; i < 3; i++) {
      await TicketType.create({ name: `EL Ticket ${ts}-${i}`, price: 10, quantity: 100, event: event.id })
    }
    const ticketTypes = await TicketType.with('event').get()
    const withEvent = ticketTypes.filter(t => t.event)
    assert.ok(withEvent.length >= 3)
    for (const ticketType of withEvent) {
      assert.ok(ticketType.event.id)
      assert.ok(ticketType.event.title)
    }
  })

  test('loads belongsTo relation for discount codes', async () => {
    const ts = Date.now()
    const event = await Event.create({ title: `DC Event ${ts}`, slug: `dc-event-${ts}`, startsAt: new Date('2026-09-01T10:00:00Z') })
    await DiscountCode.create({ code: `DISC-${ts}`, type: 'percentage', value: 10, event: event.id })

    const codes = await DiscountCode.with('event').get()
    const withEvent = codes.filter(c => c.event)
    assert.ok(withEvent.length >= 1)
    assert.ok(withEvent[0].event.id)
    assert.ok(withEvent[0].event.title)
  })

  test('loads belongsTo as null when no related record', async () => {
    const ts = Date.now()
    const ticketType = await TicketType.create({ name: `Orphan Ticket ${ts}`, price: 5, quantity: 50 })
    const loaded = await TicketType.with('event').find(ticketType.id)
    assert.ok(loaded)
    assert.strictEqual(loaded.event, null, 'event should be null when no related record')
  })
})
