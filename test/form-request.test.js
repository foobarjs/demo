import { test, describe, assert, before, boot } from 'foobarjs/test'

before(async () => {
  await boot()
})

describe('Form Request Validation', () => {
  // v0.3.2: ValidationError handling is content-negotiated by the framework's
  // ErrorHandler. Web (HTML) request → 302 redirect back with flashed errors +
  // old input. JSON request → 422 with an errors map. Controllers just do
  // `await this.validateOrBack(V)` and let the framework handle both shapes.
  test('redirects back with errors when validation fails (HTML)', async ({ request }) => {
    const res = await request
      .post('/checkout')
      .set('Accept', 'text/html')
      .form({ name: '', email: '', event_id: '', ticket_type_id: '', quantity: '' })

    assert.strictEqual(res.status, 302)
  })

  test('returns 422 JSON when Accept is JSON (web route)', async ({ request }) => {
    const res = await request
      .post('/checkout')
      .send({ name: '', email: '', event_id: '', ticket_type_id: '', quantity: '' })

    assert.strictEqual(res.status, 422)
    const body = await res.json()
    assert.ok(body?.errors, 'expected errors map in JSON body')
  })
})
