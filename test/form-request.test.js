import { test, describe, assert, before, boot } from 'foobarjs/test'

before(async () => {
  await boot()
})

describe('Form Request Validation', () => {
  test('redirects back with errors when validation fails', async ({ request }) => {
    const res = await request
      .post('/checkout')
      .set('Accept', 'text/html')
      .form({ name: '', email: '', event_id: '', ticket_type_id: '', quantity: '' })

    assert.strictEqual(res.status, 302)
  })

  test('returns JSON errors for API requests', async ({ request }) => {
    const res = await request
      .post('/checkout')
      .send({ name: '', email: '', event_id: '', ticket_type_id: '', quantity: '' })

    assert.strictEqual(res.status, 422)
    const data = await res.json()
    assert.ok(data.errors)
    assert.ok(data.errors.name)
    assert.ok(data.errors.email)
    assert.ok(data.errors.event_id)
    assert.ok(data.errors.ticket_type_id)
    assert.ok(data.errors.quantity)
  })
})
