import { test, describe, assert, before, boot } from 'foobarjs/test'
import { Mailer } from 'foobarjs/mail'
import Event from '../app/models/event.model.js'
import TicketType from '../app/models/ticket-type.model.js'

before(async () => {
  await boot()
  Mailer.configure({ driver: 'array' })
})

describe('Events', () => {
  test('checkout page renders', async ({ request }) => {
    const ts = Date.now()
    const event = await Event.create({ title: `Checkout Event ${ts}`, slug: `checkout-evt-${ts}`, startsAt: new Date('2026-09-01T10:00:00Z'), status: 'published' })
    const res = await request.get(`/checkout?event=${event.id}`)
    assert.strictEqual(res.status, 200)
  })

  test('checkout dispatches OrderPlaced and sends confirmation email', async ({ request }) => {
    Mailer.clearArrayDriver()

    const ts = Date.now()
    const event = await Event.create({ title: `Order Event ${ts}`, slug: `order-evt-${ts}`, startsAt: new Date('2026-09-01T10:00:00Z'), status: 'published' })
    const ticketType = await TicketType.create({ name: 'General', price: 25, quantity: 100, event: event.id })

    const checkoutRes = await request
      .post('/checkout')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        event_id: event.id,
        ticket_type_id: ticketType.id,
        quantity: 1,
      })

    assert.strictEqual(checkoutRes.status, 201)

    const emails = Mailer.getArrayDriverMessages()
    assert.ok(emails.length >= 1, 'Expected at least one email')
    assert.ok(emails.some(e => e.subject.includes('confirmed')))
  })
})
