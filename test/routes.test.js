import { test, describe, assert, before, boot } from 'foobarjs/test'

before(async () => {
  await boot()
})

describe('Public Routes', () => {
  test('home page returns 200', async ({ request }) => {
    const res = await request.get('/')
    assert.strictEqual(res.status, 200)
  })

  test('products index returns 200', async ({ request }) => {
    const res = await request.get('/products')
    assert.strictEqual(res.status, 200)
  })

  test('product show returns 200 for valid id', async ({ request }) => {
    const res = await request.get('/products/1')
    assert.strictEqual(res.status, 200)
  })

  test('product show returns 404 for invalid id', async ({ request }) => {
    const res = await request.get('/products/99999')
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
  test('GET /api/products returns a paginated { data, meta } envelope', async ({ request }) => {
    const res = await request.get('/api/products')
    assert.strictEqual(res.status, 200)
    const body = await res.json()
    assert.ok(Array.isArray(body.data))
    assert.strictEqual(body.meta.currentPage, 1)
    assert.strictEqual(typeof body.meta.total, 'number')
  })

  test('GET /api/products/1 returns product', async ({ request }) => {
    const res = await request.get('/api/products/1')
    assert.strictEqual(res.status, 200)
    const data = await res.json()
    assert.ok(data.name)
  })

  test('GET /api/products/99999 returns 404', async ({ request }) => {
    const res = await request.get('/api/products/99999')
    assert.strictEqual(res.status, 404)
  })

  test('GET /api/categories returns 200', async ({ request }) => {
    const res = await request.get('/api/categories')
    assert.strictEqual(res.status, 200)
  })

  test('POST /api/products requires authentication (write gate)', async ({ request }) => {
    const res = await request
      .post('/api/products')
      .form({ name: 'Nope', slug: `nope-${Date.now()}`, price: '1' })
    assert.strictEqual(res.status, 401)
  })

  test('GET /api/products?page= returns a { data, meta } envelope', async ({ request }) => {
    const res = await request.get('/api/products?page=1&perPage=2')
    assert.strictEqual(res.status, 200)
    const body = await res.json()
    assert.ok(Array.isArray(body.data), 'data should be an array')
    assert.ok(body.data.length <= 2, 'perPage should cap the page size')
    assert.strictEqual(body.meta.currentPage, 1)
    assert.strictEqual(body.meta.perPage, 2)
    assert.strictEqual(typeof body.meta.total, 'number')
  })

  test('GET /api/products?filter[published]=true narrows to published rows', async ({ request }) => {
    const res = await request.get('/api/products?filter[published]=true')
    assert.strictEqual(res.status, 200)
    const { data } = await res.json()
    assert.ok(Array.isArray(data))
    assert.ok(data.every(p => p.published === true), 'every returned product should be published')
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
    const res = await request.get('/api/products')
    const ct = res.headers.get('content-type') || ''
    assert.ok(ct.includes('json'), `Expected JSON content type, got: ${ct}`)
  })

  test('HTML page returns HTML', async ({ request }) => {
    const res = await request.get('/products')
    const ct = res.headers.get('content-type') || ''
    assert.ok(ct.includes('html'), `Expected HTML content type, got: ${ct}`)
  })
})

describe('Flash Messages', () => {
  test('flash message is shown after redirect', async ({ request }) => {
    const postRes = await request
      .post('/cart')
      .set('Accept', 'text/html')
      .form({ product_id: '1', quantity: '1' })

    assert.strictEqual(postRes.status, 302)

    const getRes = await request.get('/products')
    assert.strictEqual(getRes.status, 200)
    const text = await getRes.text()
    assert.ok(text.includes('Added'), `Expected flash message in response, got: ${text.slice(0, 200)}`)
  })
})
