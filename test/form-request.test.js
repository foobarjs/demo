import { test, describe, assert, before, boot } from 'foobarjs/test'

before(async () => {
  await boot()
})

describe('Form Request Validation', () => {
  // /checkout lives in routes/web.js and is a pure SSR route — it always
  // redirects on validation failure, regardless of Accept header. API-style
  // callers that need JSON errors should hit routes registered in routes/api.js,
  // which return 422 via the built-in `api` middleware stack.
  test('redirects back with errors when validation fails (HTML)', async ({ request }) => {
    const res = await request
      .post('/checkout')
      .set('Accept', 'text/html')
      .form({ name: '', email: '', event_id: '', ticket_type_id: '', quantity: '' })

    assert.strictEqual(res.status, 302)
  })

  test('redirects back with errors even when Accept is JSON (web route)', async ({ request }) => {
    const res = await request
      .post('/checkout')
      .send({ name: '', email: '', event_id: '', ticket_type_id: '', quantity: '' })

    assert.strictEqual(res.status, 302)
  })
})
