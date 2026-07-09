import { test, describe, assert, before, boot } from 'foobarjs/test'
import { PersonalAccessToken } from 'foobarjs/auth'
import User from '../app/models/user.model.js'
import Product from '../app/models/product.model.js'

let _adminUser = null
let _adminToken = null

before(async () => {
  await boot()
  const s = `${Date.now()}-${process.pid}-adminval-${Math.random().toString(36).slice(2, 10)}`
  _adminUser = await User.create({
    name: 'Admin Validation User',
    email: `admin-val-${s}@example.com`,
    password: 'secret123',
  })
  _adminUser.forceFill({ isAdmin: true, roles: ['admin'] })
  await _adminUser.save()
  const created = await PersonalAccessToken.createFor(_adminUser, `admin-val-token-${s}`)
  _adminToken = created.plainTextToken
})

function adminRequest(request) {
  return {
    user: _adminUser,
    get: (path) => request.get(path).set('Authorization', `Bearer ${_adminToken}`),
    post: (path) => request.post(path).set('Authorization', `Bearer ${_adminToken}`),
    put: (path) => request.put(path).set('Authorization', `Bearer ${_adminToken}`),
    delete: (path) => request.delete(path).set('Authorization', `Bearer ${_adminToken}`),
  }
}

describe('Admin — form validation', () => {
  test('creating a product with a duplicate slug re-renders form with error (does NOT silently redirect)', async ({ request }) => {
    const admin = adminRequest(request)
    const ts = Date.now()
    const slug = `dup-slug-${ts}`

    // Seed a product with the slug we'll try to duplicate.
    const first = await admin.post('/admin/products').form({
      name: `Original ${ts}`,
      slug,
      price: '10.00',
      stock: '1',
      published: 'true',
    })
    assert.strictEqual(first.status, 302, 'first create should succeed with redirect')

    const dup = await admin
      .post('/admin/products')
      .set('Accept', 'text/html')
      .form({
        name: `Duplicate ${ts}`,
        slug,
        price: '20.00',
        stock: '2',
        published: 'true',
      })

    assert.strictEqual(dup.status, 200, 'duplicate should re-render form (not redirect)')
    const text = await dup.text()
    assert.ok(text.includes('New Product') || text.includes('form'), 'should re-render the form')
    assert.ok(/already been taken|already exists|unique/i.test(text),
      `should surface the unique constraint error, got: ${text.slice(0, 600)}`)
    // The Slug field should be next to the input, not just the summary.
    assert.ok(text.includes('is-invalid') || text.includes('has-error') || text.includes('alert-danger'),
      'should highlight the invalid field or show a summary panel')
    // Old input should be preserved so the user doesn't retype the whole form.
    assert.ok(text.includes(`Duplicate ${ts}`), 'should preserve the entered name')
    assert.ok(text.includes(slug), 'should preserve the entered slug')
  })

  test('creating a product without required name shows validation error', async ({ request }) => {
    const admin = adminRequest(request)
    const ts = Date.now()

    const res = await admin
      .post('/admin/products')
      .set('Accept', 'text/html')
      .form({
        name: '',
        slug: `no-name-${ts}`,
        price: '10.00',
        stock: '1',
      })

    assert.strictEqual(res.status, 200, 'should re-render form on validation failure')
    const text = await res.text()
    assert.ok(/required|is missing|cannot be/i.test(text),
      `should include a required message, got: ${text.slice(0, 400)}`)
  })

  test('updating a product to a used slug shows validation error', async ({ request }) => {
    const admin = adminRequest(request)
    const ts = Date.now()

    const a = await Product.create({ name: `A ${ts}`, slug: `slug-a-${ts}`, price: 5, stock: 1 })
    const b = await Product.create({ name: `B ${ts}`, slug: `slug-b-${ts}`, price: 5, stock: 1 })

    const res = await admin
      .put(`/admin/products/${b.id}`)
      .set('Accept', 'text/html')
      .form({
        name: b.name,
        slug: a.slug, // take A's slug
        price: '5.00',
        stock: '1',
      })
    assert.strictEqual(res.status, 200, 'should re-render form on unique violation')
    const text = await res.text()
    assert.ok(/already been taken|already exists|unique/i.test(text),
      `should include a unique-violation message, got: ${text.slice(0, 400)}`)
  })

  test('form error summary panel renders when there is at least one error', async ({ request }) => {
    const admin = adminRequest(request)

    const res = await admin
      .post('/admin/products')
      .set('Accept', 'text/html')
      .form({
        name: '',
        slug: '',
        price: '',
        stock: '',
      })

    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Please fix the following:'),
      `summary panel should be visible, got: ${text.slice(0, 400)}`)
  })

  test('submitting empty value for a Date field does NOT silently redirect to home', async ({ request }) => {
    // Regression: MikroORM's setter throws "Trying to set X.paid_at of type 'Date'
    // to '' of type 'string'". The admin used to silently redirect to '/' with
    // an empty flash payload. The framework now either:
    //   (a) normalises the empty string to null at the admin layer and saves,
    //   (b) translates the MikroORM error into a per-field ValidationError and
    //       re-renders the form,
    //   (c) renders a proper 500 page (with logging + request id) if the error
    //       cannot be attributed to a field.
    // A silent 302 to `/` (or Referer) with no user-visible error is what we
    // are guarding against.
    const admin = adminRequest(request)
    const { default: Order } = await import('../app/models/order.model.js')
    let order = await Order.query().orderBy('id', 'desc').first()
    if (!order) {
      try {
        order = await Order.create({ status: 'pending', total: 10 })
      } catch {
        return
      }
    }

    const res = await admin
      .put(`/admin/orders/${order.id}`)
      .set('Accept', 'text/html')
      .form({
        status: 'paid',
        total: '10',
        paidAt: '',
        shippingAddress: '',
      })

    // Any of: 200 (form re-render with errors), 302 to /admin/orders (success),
    // or 500 (proper error page with logging) is fine. What is NOT fine:
    // 302 to '/' or Referer with no error output.
    if (res.status === 302) {
      const location = res.headers.get('location') || ''
      assert.ok(
        location.startsWith('/admin/orders'),
        `date-field failure must not redirect to '/' silently; got ${location}`
      )
    } else if (res.status === 200) {
      const text = await res.text()
      assert.ok(
        /must be a valid|is required|invalid|error/i.test(text),
        `200 response must include an error message; got: ${text.slice(0, 400)}`
      )
    } else {
      // 500 is acceptable — must include the request ID header for triage.
      assert.strictEqual(res.status, 500)
      assert.ok(res.headers.get('X-Request-Id') || res.headers.get('x-request-id'))
    }
  })
})
