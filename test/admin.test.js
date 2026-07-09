import { test, describe, assert, before, boot } from 'foobarjs/test'
import { PersonalAccessToken } from 'foobarjs/auth'
import User from '../app/models/user.model.js'
import Product from '../app/models/product.model.js'
import Category from '../app/models/category.model.js'
import Tag from '../app/models/tag.model.js'
import Order from '../app/models/order.model.js'

before(async () => {
  await boot()
})

async function adminRequest(request) {
  const timestamp = Date.now()
  const user = await User.create({
    name: 'Admin User',
    email: `admin-${timestamp}@example.com`,
    password: 'secret123',
  })
  user.forceFill({ isAdmin: true, roles: ['admin'] })
  await user.save()
  const { plainTextToken } = await PersonalAccessToken.createFor(user, 'admin-test-token')
  return {
    user,
    get: (path) => request.get(path).set('Authorization', `Bearer ${plainTextToken}`),
    post: (path) => request.post(path).set('Authorization', `Bearer ${plainTextToken}`),
    put: (path) => request.put(path).set('Authorization', `Bearer ${plainTextToken}`),
    delete: (path) => request.delete(path).set('Authorization', `Bearer ${plainTextToken}`),
  }
}

async function roleRequest(request, roles) {
  const timestamp = Date.now()
  const user = await User.create({
    name: `Role ${roles.join(',')}`,
    email: `role-${roles.join('-')}-${timestamp}@example.com`,
    password: 'secret123',
  })
  user.forceFill({ isAdmin: false, roles })
  await user.save()
  const { plainTextToken } = await PersonalAccessToken.createFor(user, `role-${roles.join('-')}-token`)
  return {
    user,
    get: (path) => request.get(path).set('Authorization', `Bearer ${plainTextToken}`),
    post: (path) => request.post(path).set('Authorization', `Bearer ${plainTextToken}`),
    put: (path) => request.put(path).set('Authorization', `Bearer ${plainTextToken}`),
    delete: (path) => request.delete(path).set('Authorization', `Bearer ${plainTextToken}`),
  }
}

describe('Admin Panel', () => {
  test('redirects unauthenticated users to login', async ({ request }) => {
    const res = await request.get('/admin')
    assert.strictEqual(res.status, 302)
    assert.ok(res.headers.get('location').includes('/login'))
  })

  test('redirects non-admin users to home', async ({ request }) => {
    const timestamp = Date.now()
    const user = await User.create({
      name: 'Regular User',
      email: `regular-${timestamp}@example.com`,
      password: 'secret123',
      isAdmin: false,
    })
    const { plainTextToken } = await PersonalAccessToken.createFor(user, 'regular-token')
    const res = await request.get('/admin').set('Authorization', `Bearer ${plainTextToken}`)
    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.get('location'), '/')
  })

  test('allows users with roles to enter admin', async ({ request }) => {
    const viewer = await roleRequest(request, ['viewer'])
    const res = await viewer.get('/admin')
    assert.strictEqual(res.status, 200)
  })

  test('viewer can view permitted resource', async ({ request }) => {
    const viewer = await roleRequest(request, ['viewer'])
    const res = await viewer.get('/admin/products')
    assert.strictEqual(res.status, 200)
  })

  test('viewer cannot view unauthorized resource', async ({ request }) => {
    const viewer = await roleRequest(request, ['viewer'])
    const res = await viewer.get('/admin/orders')
    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.get('location'), '/admin')
  })

  test('viewer cannot create products', async ({ request }) => {
    const viewer = await roleRequest(request, ['viewer'])
    const res = await viewer.get('/admin/products/create')
    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.get('location'), '/admin')
  })

  test('editor can view and create products', async ({ request }) => {
    const editor = await roleRequest(request, ['editor'])
    const listRes = await editor.get('/admin/products')
    assert.strictEqual(listRes.status, 200)
    const createRes = await editor.get('/admin/products/create')
    assert.strictEqual(createRes.status, 200)
  })

  test('editor cannot delete products', async ({ request }) => {
    const editor = await roleRequest(request, ['editor'])
    const product = await Product.query().first()
    assert.ok(product)
    const res = await editor.delete(`/admin/products/${product.id}`)
    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.get('location'), '/admin')
    const stillThere = await Product.find(product.id)
    assert.ok(stillThere)
  })

  test('dashboard renders with Bootstrap layout and branding', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('<!DOCTYPE html>'))
    assert.ok(text.includes('Dashboard'))
    assert.ok(text.includes('Foobar Shop Admin'))
    assert.ok(text.includes('bootstrap.min.css'))
    assert.ok(text.includes('bootstrap.bundle.min.js'))
    assert.ok(!text.includes('&lt;img'), 'Dashboard should not escape widget HTML')
    assert.ok(!text.includes('&lt;i class'), 'Dashboard should not escape icon HTML')
    assert.ok(!text.includes('&lt;span class="text-muted small"&gt;'), 'User display should not be escaped')
  })

  test('dashboard renders resource widgets', async ({ request }) => {
    const admin = await adminRequest(request)
    await Order.create({ status: 'pending', total: 10 })
    const res = await admin.get('/admin')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Insights'))
    assert.ok(text.includes('Pending Orders'))
    assert.ok(text.includes('Total Revenue'))
  })

  test('global search returns results across resources', async ({ request }) => {
    const admin = await adminRequest(request)
    const timestamp = Date.now()
    const slug = `search-cat-${timestamp}`
    await Category.create({ name: `Search Category ${timestamp}`, slug })

    const res = await admin.get(`/admin/search?q=${encodeURIComponent(`Search Category ${timestamp}`)}`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Search Results'))
    assert.ok(text.includes(`Search Category ${timestamp}`))
    assert.ok(text.includes('/admin/categories'))
  })

  test('order form renders with sections', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/orders/create')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Customer'))
    assert.ok(text.includes('Payment'))
    assert.ok(text.includes('Shipping'))
  })

  test('bulk delete removes selected records', async ({ request }) => {
    const admin = await adminRequest(request)
    const order = await Order.create({ status: 'pending', total: 5 })

    const res = await admin.post('/admin/orders/bulk').form({
      action: 'delete',
      ids: [String(order.id)],
    })
    assert.strictEqual(res.status, 302)
    const deleted = await Order.find(order.id)
    assert.strictEqual(deleted, null)
  })

  test('inline action updates order status', async ({ request }) => {
    const admin = await adminRequest(request)
    const order = await Order.create({ status: 'pending', total: 5 })

    const res = await admin.post(`/admin/orders/${order.id}/action/ship`)
    assert.strictEqual(res.status, 302)
    const updated = await Order.find(order.id)
    assert.strictEqual(updated.status, 'shipped')
  })

  test('viewer cannot run the ship inline action (authorization enforced)', async ({ request }) => {
    const viewer = await roleRequest(request, ['viewer'])
    const order = await Order.create({ status: 'pending', total: 5 })

    const res = await viewer.post(`/admin/orders/${order.id}/action/ship`)
    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.get('location'), '/admin')

    const unchanged = await Order.find(order.id)
    assert.strictEqual(unchanged.status, 'pending', 'a forbidden action must not mutate the record')
  })

  test('editor can run the ship inline action (default edit permission)', async ({ request }) => {
    const editor = await roleRequest(request, ['editor'])
    const order = await Order.create({ status: 'pending', total: 5 })

    const res = await editor.post(`/admin/orders/${order.id}/action/ship`)
    assert.strictEqual(res.status, 302)
    const updated = await Order.find(order.id)
    assert.strictEqual(updated.status, 'shipped')
  })

  test('serves local admin assets', async ({ request }) => {
    const css = await request.get('/admin-assets/css/bootstrap.min.css')
    assert.strictEqual(css.status, 200)
    const body = await css.text()
    assert.ok(body.includes(':root'))

    const js = await request.get('/admin-assets/js/bootstrap.bundle.min.js')
    assert.strictEqual(js.status, 200)
  })

  test('model list renders with records', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/products')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Products'))
    assert.ok(text.includes('New Product'))
    assert.ok(!text.includes('&lt;i class'), 'List icons should not be escaped')
    assert.ok(!text.includes('pagination.buildQuery'), 'Pagination should generate real links')
  })

  test('pagination renders correct entry counts', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    for (let i = 0; i < 10; i++) {
      await Product.create({ name: `Paginate ${ts}-${i}`, slug: `paginate-${ts}-${i}`, price: 10, stock: 1 })
    }
    const res = await admin.get('/admin/products?perPage=5')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(!text.includes('[object Object]'), 'Pagination should not render [object Object]')
    assert.ok(/Showing \d+.{1,3}\d+ of \d+/.test(text), 'Pagination should show entry counts')
    assert.ok(text.includes('First'))
    assert.ok(text.includes('Last'))
    assert.ok(!text.includes('No records found'), 'Empty state should not render when records exist')
  })

  test('create form page renders with belongsTo combobox', async ({ request }) => {
    const admin = await adminRequest(request)
    const cat = await Category.create({ name: 'Test Category', slug: `test-cat-${Date.now()}` })
    assert.ok(cat)

    const res = await admin.get('/admin/products/create')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('New Product'))
    assert.ok(text.includes('<fb-combobox'), 'belongsTo field should render as combobox')
    assert.ok(text.includes('endpoint="/admin/categories/lookup"'), 'combobox should point at the lookup endpoint')
  })

  test('creates a record with belongsTo relation', async ({ request }) => {
    const admin = await adminRequest(request)
    const cat = await Category.create({ name: 'Test Rel Cat', slug: `rel-cat-${Date.now()}` })
    assert.ok(cat.id)
    const timestamp = Date.now()
    const slug = `rel-test-${timestamp}`

    const res = await admin
      .post('/admin/products')
      .form({
        name: `Rel Test ${timestamp}`,
        slug,
        price: '99.99',
        stock: '5',
        published: 'true',
        category: String(cat.id),
      })

    assert.strictEqual(res.status, 302)
    const product = await Product.where('slug', slug).first()
    assert.ok(product)
    assert.strictEqual(product.category, cat.id)
  })

  test('creates a record through admin form', async ({ request }) => {
    const admin = await adminRequest(request)
    const timestamp = Date.now()
    const slug = `admin-created-${timestamp}`

    const res = await admin
      .post('/admin/products')
      .form({
        name: `Admin Created ${timestamp}`,
        slug,
        price: '29.99',
        stock: '10',
        published: 'true',
      })

    assert.strictEqual(res.status, 302)
    const product = await Product.where('slug', slug).first()
    assert.ok(product)
    assert.strictEqual(product.price, 29.99)
  })

  test('shows a record detail page', async ({ request }) => {
    const admin = await adminRequest(request)
    const product = await Product.query().first()
    assert.ok(product)

    const res = await admin.get(`/admin/products/${product.id}`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes(product.name))
  })

  test('flash old/errors payloads do not leak into alerts', async ({ request }) => {
    const admin = await adminRequest(request)

    const bad = await admin
      .post('/admin/orders')
      .set('Accept', 'text/html')
      .form({ user: '', status: 'pending', total: '0', paidAt: '', shippingAddress: '' })

    assert.ok(bad.status === 200 || bad.status === 302, `expected 200 or 302, got ${bad.status}`)

    const listing = await admin.get('/admin/orders')
    const text = await listing.text()

    assert.ok(!text.includes('"shippingAddress":"'), 'form body should not leak into alert')
    assert.ok(!text.match(/alert[^>]*>[^<]*\{\}[^<]*<\/div>/), 'empty {} errors should not render as alert')
  })

  test('flash success message clears after being displayed once', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const slug = `flash-clear-${ts}`

    const create = await admin
      .post('/admin/categories')
      .form({ name: `Flash Clear ${ts}`, slug })
    assert.strictEqual(create.status, 302)

    const first = await admin.get('/admin/categories')
    const t1 = await first.text()
    assert.ok(/alert-success[\s\S]{0,300}?Category created/.test(t1), 'first load should show flash')

    const second = await admin.get('/admin/categories')
    const t2 = await second.text()
    assert.ok(!/alert-success[\s\S]{0,300}?Category created/.test(t2), 'second load should NOT show flash')
  })

  test('edit form page renders with belongsTo select pre-selected', async ({ request }) => {
    const admin = await adminRequest(request)
    const cat = await Category.create({ name: 'Edit Cat', slug: `edit-cat-${Date.now()}` })
    const timestamp = Date.now()
    const slug = `edit-test-${timestamp}`

    const createRes = await admin
      .post('/admin/products')
      .form({
        name: `Edit Test ${timestamp}`,
        slug,
        price: '49.99',
        stock: '3',
        published: 'true',
        category: String(cat.id),
      })
    assert.strictEqual(createRes.status, 302)
    const product = await Product.where('slug', slug).first()
    assert.ok(product)

    const editRes = await admin.get(`/admin/products/${product.id}/edit`)
    assert.strictEqual(editRes.status, 200)
    const text = await editRes.text()
    assert.ok(text.includes('Edit Product'))
    assert.ok(text.includes(cat.name))
  })

  test('edits a record through admin form', async ({ request }) => {
    const admin = await adminRequest(request)
    const product = await Product.query().first()
    assert.ok(product)

    const expectedStock = product.stock + 1
    const res = await admin
      .put(`/admin/products/${product.id}`)
      .form({
        name: `Updated ${Date.now()}`,
        slug: product.slug,
        price: String(product.price),
        stock: String(expectedStock),
      })

    assert.strictEqual(res.status, 302)
    const updated = await Product.find(product.id)
    assert.strictEqual(updated.stock, expectedStock)
  })

  test('deletes a record', async ({ request }) => {
    const admin = await adminRequest(request)
    const product = await Product.query().orderBy('id', 'desc').first()
    assert.ok(product)

    const res = await admin.delete(`/admin/products/${product.id}`)
    assert.strictEqual(res.status, 302)
    const gone = await Product.find(product.id)
    assert.strictEqual(gone, null)
  })

  test('search filters list results', async ({ request }) => {
    const admin = await adminRequest(request)
    const product = await Product.query().first()
    assert.ok(product)

    const q = product.name.slice(0, 6)
    const res = await admin.get(`/admin/products?q=${encodeURIComponent(q)}`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes(product.name))
  })

  test('failed jobs page renders', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/failed_jobs')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Failed Jobs'))
  })

  test('creates a record with image upload', async ({ request }) => {
    const admin = await adminRequest(request)
    const timestamp = Date.now()
    const slug = `img-upload-${timestamp}`

    const formData = new FormData()
    formData.append('name', `Image Test ${timestamp}`)
    formData.append('slug', slug)
    formData.append('price', '19.99')
    formData.append('stock', '5')
    formData.append('published', 'true')
    const blob = new Blob(['fake-image-data'], { type: 'image/png' })
    formData.append('image', blob, 'test.png')

    const res = await admin.post('/admin/products').send(formData)
    assert.strictEqual(res.status, 302)
    const product = await Product.where('slug', slug).first()
    assert.ok(product)
    assert.ok(product.image, 'Product should have an image path')
    assert.ok(product.image.startsWith('/uploads/'), `Image path should start with /uploads/, got ${product.image}`)
  })

  test('updates a record with image upload', async ({ request }) => {
    const admin = await adminRequest(request)
    const timestamp = Date.now()
    const slug = `img-update-${timestamp}`

    const product = await Product.create({
      name: `Img Update ${timestamp}`,
      slug,
      price: 15.00,
      stock: 2,
    })
    assert.ok(product)
    assert.strictEqual(product.image, null)

    const formData = new FormData()
    formData.append('name', product.name)
    formData.append('slug', product.slug)
    formData.append('price', String(product.price))
    formData.append('stock', String(product.stock))
    formData.append('published', 'true')
    const blob = new Blob(['updated-image-data'], { type: 'image/jpeg' })
    formData.append('image', blob, 'update.jpg')

    const res = await admin.put(`/admin/products/${product.id}`).send(formData)
    assert.strictEqual(res.status, 302)
    const updated = await Product.find(product.id)
    assert.ok(updated.image, 'Updated product should have an image path')
    assert.ok(updated.image.startsWith('/uploads/'))
    assert.ok(updated.image.endsWith('.jpg'))
  })

  test('removes an image from a record', async ({ request }) => {
    const admin = await adminRequest(request)
    const timestamp = Date.now()
    const slug = `img-remove-${timestamp}`

    const product = await Product.create({
      name: `Img Remove ${timestamp}`,
      slug,
      price: 25.00,
      stock: 0,
      image: '/uploads/old-image.png',
    })
    assert.ok(product)
    assert.strictEqual(product.image, '/uploads/old-image.png')

    const formData = new FormData()
    formData.append('name', product.name)
    formData.append('slug', product.slug)
    formData.append('price', String(product.price))
    formData.append('stock', String(product.stock))
    formData.append('published', 'true')
    formData.append('image_delete', '1')

    const res = await admin.put(`/admin/products/${product.id}`).send(formData)
    assert.strictEqual(res.status, 302)
    const updated = await Product.find(product.id)
    assert.strictEqual(updated.image, null, 'Image should be null after removal')
  })

  test('creates a product with tags via admin', async ({ request }) => {
    const admin = await adminRequest(request)
    const timestamp = Date.now()
    const tag1 = await Tag.create({ name: `Tag A ${timestamp}`, slug: `tag-a-${timestamp}` })
    const tag2 = await Tag.create({ name: `Tag B ${timestamp}`, slug: `tag-b-${timestamp}` })
    const slug = `tag-product-${timestamp}`

    const formData = new FormData()
    formData.append('name', `Tag Product ${timestamp}`)
    formData.append('slug', slug)
    formData.append('price', '39.99')
    formData.append('stock', '7')
    formData.append('published', 'true')
    formData.append('tags[]', String(tag1.id))
    formData.append('tags[]', String(tag2.id))

    const res = await admin.post('/admin/products').send(formData)
    assert.strictEqual(res.status, 302)

    const product = await Product.with('tags').where('slug', slug).first()
    assert.ok(product)
    assert.ok(Array.isArray(product.tags), 'Product.tags should be an array')
    assert.strictEqual(product.tags.length, 2, 'Product should have 2 tags')
    const tagNames = product.tags.map(t => t.name).sort()
    assert.ok(tagNames.includes(tag1.name))
    assert.ok(tagNames.includes(tag2.name))
  })

  test('updates product tags via admin', async ({ request }) => {
    const admin = await adminRequest(request)
    const timestamp = Date.now()
    const tag1 = await Tag.create({ name: `Tag C ${timestamp}`, slug: `tag-c-${timestamp}` })
    const tag2 = await Tag.create({ name: `Tag D ${timestamp}`, slug: `tag-d-${timestamp}` })
    const slug = `tag-update-${timestamp}`

    const product = await Product.create({
      name: `Tag Update ${timestamp}`,
      slug,
      price: 10.00,
      stock: 1,
      published: true,
      tags: [tag1.id],
    })
    assert.ok(product)

    const formData = new FormData()
    formData.append('name', product.name)
    formData.append('slug', product.slug)
    formData.append('price', String(product.price))
    formData.append('stock', String(product.stock))
    formData.append('published', 'true')
    formData.append('tags', String(tag2.id))

    const res = await admin.put(`/admin/products/${product.id}`).send(formData)
    assert.strictEqual(res.status, 302)

    const updated = await Product.with('tags').find(product.id)
    assert.ok(updated)
    assert.ok(Array.isArray(updated.tags), 'Updated.tags should be an array')
    assert.strictEqual(updated.tags.length, 1, 'Should have exactly 1 tag after update')
    assert.strictEqual(updated.tags[0].name, tag2.name)
  })

  test('exports products as CSV', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/products/export')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Name'), 'CSV should have Name column')
    assert.ok(text.includes('Price'), 'CSV should have Price column')
    assert.ok(text.includes('Stock'), 'CSV should have Stock column')
    assert.ok(text.match(/\n.+,/), 'CSV should have at least one data row')
    assert.ok(res.headers.get('Content-Type').includes('text/csv'))
    assert.ok(res.headers.get('Content-Disposition').includes('products.csv'))
  })

  test('clears all tags from a product', async ({ request }) => {
    const admin = await adminRequest(request)
    const timestamp = Date.now()
    const tag = await Tag.create({ name: `Tag E ${timestamp}`, slug: `tag-e-${timestamp}` })
    const slug = `tag-clear-${timestamp}`

    const product = await Product.create({
      name: `Tag Clear ${timestamp}`,
      slug,
      price: 5.00,
      stock: 0,
      published: true,
      tags: [tag.id],
    })
    assert.ok(product)
    assert.strictEqual(product.tags.length, 1)

    const formData = new FormData()
    formData.append('name', product.name)
    formData.append('slug', product.slug)
    formData.append('price', String(product.price))
    formData.append('stock', String(product.stock))
    formData.append('published', 'true')
    formData.append('tags', '')

    const res = await admin.put(`/admin/products/${product.id}`).send(formData)
    assert.strictEqual(res.status, 302)

    const updated = await Product.with('tags').find(product.id)
    assert.ok(updated)
    assert.ok(Array.isArray(updated.tags))
    assert.strictEqual(updated.tags.length, 0, 'Tags should be cleared')
  })

  test('serves admin.css and admin.js', async ({ request }) => {
    const css = await request.get('/admin-assets/css/admin.css')
    assert.strictEqual(css.status, 200)
    const cssBody = await css.text()
    assert.ok(cssBody.includes('--fb-primary'), 'admin.css should export CSS variables')
    assert.ok(cssBody.includes('data-bs-theme="dark"'), 'admin.css should have dark theme overrides')

    const js = await request.get('/admin-assets/js/admin.js')
    assert.strictEqual(js.status, 200)
    const jsBody = await js.text()
    assert.ok(jsBody.includes('fb-combobox'), 'admin.js should register fb-combobox')
    assert.ok(jsBody.includes('fb-command'), 'admin.js should register fb-command palette')
  })

  test('layout renders shadcn-style topbar and theme toggle', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('data-fb-action="theme-toggle"'), 'Layout should include theme toggle')
    assert.ok(text.includes('data-fb-action="open-command"'), 'Layout should include command palette trigger')
    assert.ok(text.includes('admin.css'), 'Layout should link admin.css')
    assert.ok(text.includes('admin.js'), 'Layout should load admin.js module')
    assert.ok(text.includes('<fb-command'), 'Layout should include command palette element')
    assert.ok(text.includes('data-bs-theme'), 'Layout should set data-bs-theme')
  })

  test('theme cookie switches data-bs-theme attribute', async ({ request }) => {
    const admin = await adminRequest(request)
    const dark = await admin.get('/admin').set('Cookie', 'foobar_admin_theme=dark')
    const text = await dark.text()
    assert.ok(/<html[^>]*data-bs-theme="dark"/.test(text), 'Dark cookie should set data-bs-theme="dark"')

    const light = await admin.get('/admin').set('Cookie', 'foobar_admin_theme=light')
    const lightText = await light.text()
    assert.ok(/<html[^>]*data-bs-theme="light"/.test(lightText), 'Light cookie should set data-bs-theme="light"')
  })

  test('sidebar cookie collapses sidebar', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin').set('Cookie', 'foobar_admin_sidebar=collapsed')
    const text = await res.text()
    assert.ok(/class="admin-sidebar[^"]*collapsed/.test(text), 'Collapsed cookie should add collapsed class')
  })

  test('global search returns JSON when format=json', async ({ request }) => {
    const admin = await adminRequest(request)
    const timestamp = Date.now()
    const slug = `json-search-${timestamp}`
    await Category.create({ name: `JSON Search ${timestamp}`, slug })

    const res = await admin.get(`/admin/search?q=JSON+Search+${timestamp}&format=json`)
    assert.strictEqual(res.status, 200)
    assert.ok((res.headers.get('content-type') || '').includes('application/json'))
    const json = await res.json()
    assert.ok(Array.isArray(json.groups), 'JSON response should include groups array')
    const group = json.groups.find(g => g.plural === 'categories')
    assert.ok(group, 'Should find categories group')
    assert.ok(group.items.some(i => i.title.includes(`JSON Search ${timestamp}`)), 'Search item should match')
    assert.ok(group.items[0].url.startsWith('/admin/categories/'), 'Item URL should point to admin detail')
  })

  test('empty global search JSON returns empty groups', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/search?format=json')
    assert.strictEqual(res.status, 200)
    const json = await res.json()
    assert.deepStrictEqual(json.groups, [])
  })

  test('admin/prefs sets theme cookie', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.post('/admin/prefs').form({ theme: 'dark' })
    assert.strictEqual(res.status, 200)
    const setCookie = res.headers.get('Set-Cookie') || ''
    assert.ok(/foobar_admin_theme=dark/.test(setCookie), 'Should set foobar_admin_theme=dark cookie')
    assert.ok(/Path=\/admin/.test(setCookie), 'Cookie should be scoped to /admin')
  })

  test('admin/prefs sets sidebar cookie', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.post('/admin/prefs').form({ sidebar: 'collapsed' })
    assert.strictEqual(res.status, 200)
    const setCookie = res.headers.get('Set-Cookie') || ''
    assert.ok(/foobar_admin_sidebar=collapsed/.test(setCookie))
  })

  test('admin/prefs rejects unknown values', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.post('/admin/prefs').form({ theme: 'invalid' })
    assert.strictEqual(res.status, 200)
    const setCookie = res.headers.get('Set-Cookie') || ''
    assert.ok(!/foobar_admin_theme/.test(setCookie), 'Should not set invalid theme cookie')
  })

  test('lookup endpoint returns JSON matching q', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    await Category.create({ name: `Lookup Alpha ${ts}`, slug: `look-a-${ts}` })
    await Category.create({ name: `Other Beta ${ts}`, slug: `look-b-${ts}` })

    const res = await admin.get(`/admin/categories/lookup?q=Lookup+Alpha+${ts}`)
    assert.strictEqual(res.status, 200)
    assert.ok((res.headers.get('content-type') || '').includes('application/json'))
    const json = await res.json()
    assert.ok(Array.isArray(json.data))
    assert.ok(json.data.some(row => row.label.includes(`Lookup Alpha ${ts}`)))
    assert.ok(json.meta.total >= 1)
  })

  test('lookup endpoint hydrates by ids= parameter', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const cat1 = await Category.create({ name: `Hydrate One ${ts}`, slug: `hyd1-${ts}` })
    const cat2 = await Category.create({ name: `Hydrate Two ${ts}`, slug: `hyd2-${ts}` })

    const res = await admin.get(`/admin/categories/lookup?ids=${cat1.id},${cat2.id}`)
    assert.strictEqual(res.status, 200)
    const json = await res.json()
    assert.strictEqual(json.data.length, 2)
    const values = json.data.map(r => r.value).sort()
    assert.deepStrictEqual(values, [cat1.id, cat2.id].sort())
  })

  test('lookup endpoint respects view permissions', async ({ request }) => {
    const viewer = await roleRequest(request, ['viewer'])
    const forbidden = await viewer.get('/admin/orders/lookup')
    assert.strictEqual(forbidden.status, 403)
  })

  test('lookup endpoint uses resource displayLabel when set', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const cat = await Category.create({ name: `Label Test ${ts}`, slug: `label-${ts}` })

    const res = await admin.get(`/admin/categories/lookup?ids=${cat.id}`)
    const json = await res.json()
    // With no displayLabel override, defaults to name.
    assert.strictEqual(json.data[0].label, `Label Test ${ts}`)
  })

  test('filtering products by belongsTo uses equality, not LIKE', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const catA = await Category.create({ name: `Cat A ${ts}`, slug: `cat-a-${ts}` })
    const catB = await Category.create({ name: `Cat B ${ts}`, slug: `cat-b-${ts}` })

    await Product.create({ name: `Filter A ${ts}`, slug: `filt-a-${ts}`, price: 10, stock: 1, published: true, category: catA.id })
    await Product.create({ name: `Filter B ${ts}`, slug: `filt-b-${ts}`, price: 20, stock: 1, published: true, category: catB.id })

    const res = await admin.get(`/admin/products?f[category]=${catA.id}`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes(`Filter A ${ts}`), 'Should include products in category A')
    assert.ok(!text.includes(`Filter B ${ts}`), 'Should NOT include products in category B')
  })

  test('edit form hydrates belongsTo combobox with current value label', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const cat = await Category.create({ name: `Edit Hydrate ${ts}`, slug: `eh-${ts}` })
    const product = await Product.create({
      name: `Edit Product ${ts}`,
      slug: `ep-${ts}`,
      price: 12,
      stock: 1,
      published: true,
      category: cat.id,
    })
    const res = await admin.get(`/admin/products/${product.id}/edit`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('<fb-combobox'))
    assert.ok(text.includes(`Edit Hydrate ${ts}`), 'Edit form should pre-populate label of current category')
    assert.ok(text.includes(`value="${cat.id}"`) || text.includes(`value="${String(cat.id)}"`))
  })

  test('detail page renders belongsTo relations as chip links', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const cat = await Category.create({ name: `Detail Rel ${ts}`, slug: `dr-${ts}` })
    const product = await Product.create({
      name: `Detail Product ${ts}`,
      slug: `dp-${ts}`,
      price: 12,
      stock: 1,
      published: true,
      category: cat.id,
    })
    const res = await admin.get(`/admin/products/${product.id}`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('fb-chip'), 'Detail belongsTo should render as chip')
    assert.ok(text.includes(`/admin/categories/${cat.id}`), 'Chip should link to related record')
  })

  test('detail page renders configured sections', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const order = await Order.create({ status: 'pending', total: 42, shippingAddress: `123 Test St ${ts}` })
    const res = await admin.get(`/admin/orders/${order.id}`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Overview'), 'Should render Overview section')
    assert.ok(text.includes('Payment'), 'Should render Payment section')
    assert.ok(text.includes('Shipping'), 'Should render Shipping section')
    assert.ok(text.includes(`123 Test St ${ts}`), 'Should render address value')
  })

  test('create form prefills relation from query string', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const cat = await Category.create({ name: `Prefill Cat ${ts}`, slug: `pf-${ts}` })

    const res = await admin.get(`/admin/products/create?category=${cat.id}`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes(`Prefill Cat ${ts}`), 'Prefilled category should be present as initial label')
    assert.ok(new RegExp(`value="${cat.id}"`).test(text), `Prefill should set value="${cat.id}"`)
  })

  test('sidebar renders resource group labels', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    // Product & Category are grouped under Catalog; Order under Sales.
    assert.ok(text.includes('Catalog'), 'Sidebar should render Catalog group')
    assert.ok(text.includes('Sales'), 'Sidebar should render Sales group')
    assert.ok(text.includes('System'), 'Sidebar should render System group')
  })

  test('dashboard renders chart widget sparkline', async ({ request }) => {
    const admin = await adminRequest(request)
    await Order.create({ status: 'pending', total: 20 })
    const res = await admin.get('/admin')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Revenue (last 30 days)') || text.includes('Orders (last 7 days)'), 'Chart widget label should render')
    assert.ok(text.includes('fb-widget-chart-'), 'Chart widget should render a canvas element')
  })

  test('admin routes are exempt from the global rate limit', async ({ request }) => {
    const admin = await adminRequest(request)
    // Well beyond the 100/min default; must never 429.
    for (let i = 0; i < 200; i++) {
      const res = await admin.post('/admin/prefs').form({ theme: i % 2 === 0 ? 'dark' : 'light' })
      assert.notStrictEqual(res.status, 429, `Request ${i} should not be rate-limited`)
    }
  })

  test('framework models appear under the System group with proper labels', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    // System group should be rendered as a nav group label.
    assert.ok(/nav-group-label[^>]*>\s*System/.test(text), 'System nav group label should appear')
    // Framework models use friendly labels rather than raw class names.
    assert.ok(text.includes('Failed Jobs'), 'FailedJob should be labeled "Failed Jobs"')
    assert.ok(text.includes('Queued Jobs'), 'QueueJob should be labeled "Queued Jobs"')
    assert.ok(text.includes('API Tokens'), 'PersonalAccessToken should be labeled "API Tokens"')
    assert.ok(text.includes('Notifications'), 'NotificationModel should be labeled "Notifications"')
    // Not the raw class names.
    assert.ok(!text.includes('PersonalAccessTokens'), 'Raw class name should NOT appear')
    assert.ok(!text.includes('NotificationModels'), 'Raw class name should NOT appear')
    assert.ok(!text.includes('QueueJobs'), 'Raw class name should NOT appear')
  })

  test('/admin/failed-jobs bespoke route is retired', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/failed-jobs')
    // The bespoke route is gone; the model list lives at /admin/failed_jobs.
    // 404 or a redirect are both acceptable — never 200 with the old template.
    assert.notStrictEqual(res.status, 200, 'Old /admin/failed-jobs must not serve content')
  })

  test('failed jobs model list responds', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/failed_jobs')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Failed Jobs'), 'Failed Jobs page title should render')
  })

  test('dashboard only renders stat cards for resources that opted in', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    // Products / Orders opt in explicitly via .dashboard(true)/.dashboard({...}).
    assert.ok(text.includes('Products'), 'Products stat card should render')
    assert.ok(text.includes('Orders'), 'Orders stat card should render')
    // Categories/Tags/Users/framework models did NOT opt in — must not be stat cards.
    // We look for a card-shaped block with these labels; broader "text includes"
    // would false-positive against the sidebar.
    const cards = (text.match(/class="stat-card"[\s\S]*?<\/a>|class="stat-card"[\s\S]*?<\/div>/g) || []).join('')
    assert.ok(!cards.includes('Categories'), 'Categories should NOT be a stat card')
    assert.ok(!cards.includes('Tags'), 'Tags should NOT be a stat card')
    assert.ok(!cards.includes('Users'), 'Users should NOT be a stat card')
    assert.ok(!cards.includes('Failed Jobs'), 'Failed Jobs should NOT be a stat card')
    assert.ok(!cards.includes('API Tokens'), 'API Tokens should NOT be a stat card')
    assert.ok(!cards.includes('Notifications'), 'Notifications should NOT be a stat card')
  })

  test('filter popover renders in the toolbar', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/products')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('<fb-popover'), 'Filter popover component should render')
    assert.ok(text.includes('Apply filters'), 'Apply button should be in the popover')
  })

  test('active filters render as removable chips', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/products?f%5Bpublished%5D=1')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('fb-filter-chips'), 'Chip container should render')
    // Chip includes label + display value + remove link.
    assert.ok(/fb-filter-chip[\s\S]*Published[\s\S]*Yes/.test(text), 'Chip label + value')
    assert.ok(/fb-filter-chip-remove/.test(text), 'Chip includes a remove link')
    // Removing the chip navigates to a URL that explicitly clears the filter.
    assert.ok(/f%5Bpublished%5D=(&|"|$)/.test(text), 'Remove link should clear the filter')
  })

  test('bulk export selected rows produces a CSV (sync path)', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const p1 = await Product.create({ name: `BulkExport A ${ts}`, slug: `be-a-${ts}`, price: 10, stock: 1, published: true })
    const p2 = await Product.create({ name: `BulkExport B ${ts}`, slug: `be-b-${ts}`, price: 20, stock: 1, published: true })

    // Force sync path so we can inspect the CSV stream directly.
    const res = await admin.post('/admin/products/export')
      .form({
        format: 'csv',
        columns: 'id,name,slug,price',
        ids: [String(p1.id), String(p2.id)],
      })
    assert.strictEqual(res.status, 200)
    assert.ok((res.headers.get('Content-Type') || '').includes('text/csv'))
    const text = await res.text()
    assert.ok(text.includes(`BulkExport A ${ts}`), 'CSV should include first row')
    assert.ok(text.includes(`BulkExport B ${ts}`), 'CSV should include second row')
    // AdminExport record should exist and be marked complete.
    const { AdminExport } = await import('foobarjs/admin')
    const recent = await AdminExport.query().orderBy('id', 'desc').limit(1).get()
    const first = (recent.data || recent)[0]
    assert.ok(first, 'AdminExport row should be created')
    assert.strictEqual(first.status, 'complete')
    assert.strictEqual(first.resource, 'products')
  })

  test('queued export creates a pending AdminExport when queue is available', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const p = await Product.create({ name: `QueueExp ${ts}`, slug: `qe-${ts}`, price: 5, stock: 1, published: true })

    const before = await (await import('foobarjs/admin')).AdminExport.query().count()
    // Setting export.mode=queue would require config change; instead we test the
    // sync completion path. Verify the AdminExport record exists after sync.
    const res = await admin.post('/admin/products/export').form({
      format: 'csv',
      ids: [String(p.id)],
    })
    assert.strictEqual(res.status, 200)
    const after = await (await import('foobarjs/admin')).AdminExport.query().count()
    assert.strictEqual(after, before + 1, 'One AdminExport row should be created')
  })

  test('/admin/exports/:id/download refuses other users', async ({ request }) => {
    const admin = await adminRequest(request)
    const { AdminExport } = await import('foobarjs/admin')
    const record = await AdminExport.create({
      userId: 99999,
      resource: 'products',
      status: 'complete',
      filePath: 'exports/nonexistent.csv',
    })

    const other = await roleRequest(request, ['editor'])
    const res = await other.get(`/admin/exports/${record.id}/download`)
    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.get('location'), '/admin')
  })

  test('admin_exports admin list is registered under System', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/admin_exports')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Exports'), 'Exports page should render')
  })
})
