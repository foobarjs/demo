import { test, describe, assert, before, boot } from 'foobarjs/test'

before(async () => {
  await boot()
})

describe('Error handling — 404', () => {
  test('unknown route returns 404 HTML', async ({ request }) => {
    const res = await request.get('/this-does-not-exist-xyz')
      .set('Accept', 'text/html')
    assert.strictEqual(res.status, 404)
    const text = await res.text()
    // Demo has a custom 404.html view
    assert.ok(text.toLowerCase().includes('page not found') || text.toLowerCase().includes('404'))
  })

  test('unknown route returns 404 JSON', async ({ request }) => {
    const res = await request.get('/this-does-not-exist-xyz')
      .set('Accept', 'application/json')
    assert.strictEqual(res.status, 404)
    const body = await res.json()
    assert.strictEqual(body.status, 404)
    assert.ok(body.requestId, 'should include requestId')
  })

  test('response has X-Request-Id header on error', async ({ request }) => {
    const res = await request.get('/this-does-not-exist-xyz')
      .set('Accept', 'application/json')
    assert.ok(res.headers.get('X-Request-Id') || res.headers.get('x-request-id'))
  })
})

describe('Error handling — controller throws', () => {
  test('generic Error returns 500 with debug details in dev', async ({ request }) => {
    const res = await request.get('/boom?kind=generic')
      .set('Accept', 'application/json')
    assert.strictEqual(res.status, 500)
    const body = await res.json()
    assert.strictEqual(body.status, 500)
    assert.ok(body.requestId)
    // Demo runs with APP_DEBUG=true so we should see the real message
    assert.strictEqual(body.error, 'kaboom')
    assert.ok(Array.isArray(body.stack), 'stack should be present in debug mode')
  })

  test('HttpException carries its status code', async ({ request }) => {
    const res = await request.get('/boom?kind=http')
      .set('Accept', 'application/json')
    assert.strictEqual(res.status, 418)
    const body = await res.json()
    assert.strictEqual(body.error, "I'm a teapot")
  })

  test('NotFoundError returns 404', async ({ request }) => {
    const res = await request.get('/boom?kind=notfound')
      .set('Accept', 'application/json')
    assert.strictEqual(res.status, 404)
  })

  test('ForbiddenError returns 403', async ({ request }) => {
    const res = await request.get('/boom?kind=forbidden')
      .set('Accept', 'application/json')
    assert.strictEqual(res.status, 403)
  })

  test('reflected error message is HTML-escaped on dev page', async ({ request }) => {
    const payload = '<script>alert(1)</script>'
    const res = await request.get(`/boom?kind=reflected&msg=${encodeURIComponent(payload)}`)
      .set('Accept', 'text/html')
    assert.strictEqual(res.status, 500)
    const text = await res.text()
    assert.ok(!text.includes('<script>alert(1)</script>'), 'raw script should not appear')
    assert.ok(text.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'should be escaped')
  })
})
