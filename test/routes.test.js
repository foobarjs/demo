import { test, describe, assert, before, boot } from 'foobarjs/test'
import Event from '../app/models/event.model.js'

before(async () => {
  await boot()
})

describe('Public Routes', () => {
  test('home page returns 200', async ({ request }) => {
    const res = await request.get('/')
    assert.strictEqual(res.status, 200)
  })

  test('events index returns 200', async ({ request }) => {
    const res = await request.get('/events')
    assert.strictEqual(res.status, 200)
  })

  test('event show returns 200 for valid slug', async ({ request }) => {
    const ts = Date.now()
    const event = await Event.create({
      title: `Route Test Event ${ts}`,
      slug: `route-test-${ts}`,
      startsAt: new Date(),
      status: 'published',
    })
    const res = await request.get(`/events/${event.slug}`)
    assert.strictEqual(res.status, 200)
  })

  test('event show returns 404 for invalid slug', async ({ request }) => {
    const res = await request.get('/events/nonexistent-slug-99999')
    assert.strictEqual(res.status, 404)
  })

  test('login page returns 200', async ({ request }) => {
    const res = await request.get('/login')
    assert.strictEqual(res.status, 200)
  })

  test('register page returns 200', async ({ request }) => {
    const res = await request.get('/register')
    assert.strictEqual(res.status, 200)
  })
})

describe('Auth', () => {
  test('login with invalid credentials returns page with error', async ({ request }) => {
    const res = await request
      .post('/login')
      .set('Accept', 'text/html')
      .form({ email: 'wrong@example.com', password: 'wrong' })

    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Invalid'), `Expected error message in response, got: ${text.slice(0, 200)}`)
  })

  test('register page renders', async ({ request }) => {
    const res = await request.get('/register')
    assert.strictEqual(res.status, 200)
  })
})

describe('API', () => {
  test('GET /api/events returns a paginated { data, meta } envelope', async ({ request }) => {
    const res = await request.get('/api/events')
    assert.strictEqual(res.status, 200)
    const body = await res.json()
    assert.ok(Array.isArray(body.data))
    assert.strictEqual(body.meta.currentPage, 1)
    assert.strictEqual(typeof body.meta.total, 'number')
  })

  test('GET /api/events/:id returns event', async ({ request }) => {
    const ts = Date.now()
    const event = await Event.create({
      title: `API Show ${ts}`,
      slug: `api-show-${ts}`,
      startsAt: new Date(),
      status: 'published',
    })
    const res = await request.get(`/api/events/${event.id}`)
    assert.strictEqual(res.status, 200)
    const data = await res.json()
    assert.ok(data.title)
  })

  test('GET /api/events/99999 returns the canonical 404 error envelope', async ({ request }) => {
    const res = await request.get('/api/events/99999')
    assert.strictEqual(res.status, 404)
    const body = await res.json()
    assert.strictEqual(body.status, 404)
    assert.ok(body.error, 'carries an error message')
    assert.ok(body.requestId, 'carries a requestId (same as the X-Request-Id header)')
  })

  test('GET /api/orders requires authentication', async ({ request }) => {
    const res = await request.get('/api/orders')
    assert.strictEqual(res.status, 401)
  })

  test('GET /api/events?page= returns a { data, meta } envelope', async ({ request }) => {
    const res = await request.get('/api/events?page=1&perPage=2')
    assert.strictEqual(res.status, 200)
    const body = await res.json()
    assert.ok(Array.isArray(body.data), 'data should be an array')
    assert.ok(body.data.length <= 2, 'perPage should cap the page size')
    assert.strictEqual(body.meta.currentPage, 1)
    assert.strictEqual(body.meta.perPage, 2)
    assert.strictEqual(typeof body.meta.total, 'number')
  })

  test('GET /api/events?filter[status]=published narrows to published rows', async ({ request }) => {
    const res = await request.get('/api/events?filter[status]=published')
    assert.strictEqual(res.status, 200)
    const { data } = await res.json()
    assert.ok(Array.isArray(data))
    assert.ok(data.every(e => e.status === 'published'), 'every returned event should be published')
  })
})

describe('404 Handler', () => {
  test('unknown route returns 404', async ({ request }) => {
    const res = await request.get('/this-route-does-not-exist')
    assert.strictEqual(res.status, 404)
  })
})

describe('Response Types', () => {
  test('API endpoint returns JSON', async ({ request }) => {
    const res = await request.get('/api/events')
    const ct = res.headers.get('content-type') || ''
    assert.ok(ct.includes('json'), `Expected JSON content type, got: ${ct}`)
  })

  test('HTML page returns HTML', async ({ request }) => {
    const res = await request.get('/events')
    const ct = res.headers.get('content-type') || ''
    assert.ok(ct.includes('html'), `Expected HTML content type, got: ${ct}`)
  })
})
