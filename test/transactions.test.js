import { test, describe, assert, before, boot } from 'foobarjs/test'
import { Model } from 'foobarjs/orm'
import Event from '../app/models/event.model.js'
import TicketType from '../app/models/ticket-type.model.js'

before(async () => {
  await boot()
})

describe('Transactions', () => {
  test('rolls back on error', async () => {
    const slug = `rollback-${Date.now()}`

    try {
      await Model.transaction(async () => {
        await Event.create({ title: 'Rollback Event', slug, startsAt: new Date('2026-09-01T10:00:00Z') })
        throw new Error('Intentional rollback')
      })
    } catch (err) {
      assert.strictEqual(err.message, 'Intentional rollback')
    }

    const created = await Event.where('slug', slug).first()
    assert.strictEqual(created, null)
  })

  test('commits when successful', async () => {
    const ts = Date.now()
    const slug = `committed-${ts}`

    await Model.transaction(async () => {
      const event = await Event.create({
        title: 'Committed Event',
        slug,
        startsAt: new Date('2026-09-01T10:00:00Z'),
        status: 'published',
      })

      await TicketType.create({
        name: 'General Admission',
        price: 19.99,
        quantity: 100,
        event: event.id,
      })
    })

    const created = await Event.where('slug', slug).first()
    assert.ok(created)
  })
})
