import { test, describe, assert, before, boot } from 'foobarjs/test'
import { Mailer } from 'foobarjs/mail'

before(async () => {
  await boot()
  Mailer.configure({ driver: 'array' })
})

describe('Events', () => {
  test('checkout page renders', async ({ request }) => {
    const res = await request.get('/checkout')
    assert.strictEqual(res.status, 200)
  })

  test('checkout dispatches OrderPlaced and sends confirmation email', async ({ request }) => {
    Mailer.clearArrayDriver()

    const cartRes = await request
      .post('/cart')
      .set('Accept', 'text/html')
      .form({ product_id: '1', quantity: '1' })

    assert.strictEqual(cartRes.status, 302)

    const checkoutRes = await request
      .post('/checkout')
      .set('Accept', 'text/html')
      .form({ address: '123 Test St' })

    assert.strictEqual(checkoutRes.status, 302)

    const emails = Mailer.getArrayDriverMessages()
    assert.ok(emails.length >= 1, 'Expected at least one email')
    assert.ok(emails.some(e => e.subject.includes('Order #') && e.subject.includes('confirmed')))
  })
})
