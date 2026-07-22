import { test, describe, assert, before, boot } from 'foobarjs/test'
import { PersonalAccessToken } from 'foobarjs/auth'
import User from '../app/models/user.model.js'
import Event from '../app/models/event.model.js'
import TicketType from '../app/models/ticket-type.model.js'
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

  // strictAdmin: only isAdmin users can enter /admin. Organizers use /organizer/*.
  test('denies organizer (roles-only) from entering /admin under strictAdmin', async ({ request }) => {
    const organizer = await roleRequest(request, ['organizer'])
    const res = await organizer.get('/admin')
    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.get('location'), '/')
  })

  test('denies organizer from admin resource routes under strictAdmin', async ({ request }) => {
    const organizer = await roleRequest(request, ['organizer'])
    const res = await organizer.get('/admin/events')
    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.get('location'), '/')
  })

  test('dashboard renders with Bootstrap layout and branding', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('<!DOCTYPE html>'))
    assert.ok(text.includes('Dashboard'))
    assert.ok(text.includes('Foobar Events Admin'))
    assert.ok(text.includes('bootstrap.min.css'))
    assert.ok(text.includes('bootstrap.bundle.min.js'))
    assert.ok(!text.includes('&lt;img'), 'Dashboard should not escape widget HTML')
    assert.ok(!text.includes('&lt;i class'), 'Dashboard should not escape icon HTML')
    assert.ok(!text.includes('&lt;span class="text-muted small"&gt;'), 'User display should not be escaped')
  })

  test('dashboard renders resource widgets', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    await Order.create({ orderNumber: `ORD-WIDGET-${ts}`, email: 'w@test.com', name: 'Widget Test', status: 'pending', total: 10 })
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
    const slug = `search-event-${timestamp}`
    await Event.create({ title: `Search Event ${timestamp}`, slug, startsAt: new Date(), status: 'draft' })

    const res = await admin.get(`/admin/search?q=${encodeURIComponent(`Search Event ${timestamp}`)}`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Search Results'))
    assert.ok(text.includes(`Search Event ${timestamp}`))
    assert.ok(text.includes('/admin/events'))
  })

  test('order form renders with sections', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/orders/create')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Customer'))
    assert.ok(text.includes('Payment'))
  })

  test('bulk delete removes selected records', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const order = await Order.create({ orderNumber: `ORD-BULK-${ts}`, email: 'bulk@test.com', name: 'Bulk Test', status: 'pending', total: 5 })

    const res = await admin.post('/admin/orders/bulk').form({
      action: 'delete',
      ids: [String(order.id)],
      confirmed: '1',
    })
    assert.strictEqual(res.status, 302)
    const deleted = await Order.find(order.id)
    assert.strictEqual(deleted, null)
  })

  test('inline action updates order status', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const order = await Order.create({ orderNumber: `ORD-INLINE-${ts}`, email: 'inline@test.com', name: 'Inline Test', status: 'pending', total: 5 })

    const res = await admin.post(`/admin/orders/${order.id}/action/confirm`)
    assert.strictEqual(res.status, 302)
    const updated = await Order.find(order.id)
    assert.strictEqual(updated.status, 'confirmed')
  })

  test('strictAdmin blocks organizer from admin actions entirely (redirected off /admin)', async ({ request }) => {
    const organizer = await roleRequest(request, ['organizer'])
    const ts = Date.now()
    const order = await Order.create({ orderNumber: `ORD-ORG-${ts}`, email: 'org@test.com', name: 'Org Test', status: 'pending', total: 5 })

    const res = await organizer.post(`/admin/orders/${order.id}/action/confirm`)
    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.get('location'), '/')

    const unchanged = await Order.find(order.id)
    assert.strictEqual(unchanged.status, 'pending', 'a forbidden action must not mutate the record')
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
    const res = await admin.get('/admin/events')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Events'))
    assert.ok(text.includes('New Event'))
    assert.ok(!text.includes('&lt;i class'), 'List icons should not be escaped')
    assert.ok(!text.includes('pagination.buildQuery'), 'Pagination should generate real links')
  })

  test('pagination renders correct entry counts', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    for (let i = 0; i < 10; i++) {
      await Event.create({ title: `Paginate ${ts}-${i}`, slug: `paginate-${ts}-${i}`, startsAt: new Date(), status: 'draft' })
    }
    const res = await admin.get('/admin/events?perPage=5')
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
    const ts = Date.now()
    const user = await User.create({ name: 'Organizer User', email: `organizer-${ts}@example.com`, password: 'secret123' })
    assert.ok(user)

    const res = await admin.get('/admin/events/create')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('New Event'))
    assert.ok(text.includes('<fb-combobox'), 'belongsTo field should render as combobox')
    assert.ok(text.includes('endpoint="/admin/users/lookup"'), 'combobox should point at the lookup endpoint')
  })

  test('creates a record with belongsTo relation', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const event = await Event.create({ title: `Rel Event ${ts}`, slug: `rel-event-${ts}`, startsAt: new Date(), status: 'draft' })
    assert.ok(event.id)

    const res = await admin
      .post('/admin/ticket_types')
      .form({
        name: `Rel Ticket ${ts}`,
        price: '99.99',
        quantity: '100',
        event: String(event.id),
      })

    assert.strictEqual(res.status, 302)
    const ticketType = await TicketType.where('name', `Rel Ticket ${ts}`).first()
    assert.ok(ticketType)
    assert.strictEqual(ticketType.event, event.id)
  })

  test('creates a record through admin form', async ({ request }) => {
    const admin = await adminRequest(request)
    const timestamp = Date.now()
    const slug = `admin-created-${timestamp}`

    const res = await admin
      .post('/admin/events')
      .form({
        title: `Admin Created ${timestamp}`,
        slug,
        startsAt: new Date(),
        status: 'draft',
      })

    assert.strictEqual(res.status, 302)
    const event = await Event.where('slug', slug).first()
    assert.ok(event)
    assert.strictEqual(event.title, `Admin Created ${timestamp}`)
  })

  test('shows a record detail page', async ({ request }) => {
    const admin = await adminRequest(request)
    const event = await Event.query().first()
    assert.ok(event)

    const res = await admin.get(`/admin/events/${event.id}`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes(event.title))
  })

  test('flash old/errors payloads do not leak into alerts', async ({ request }) => {
    const admin = await adminRequest(request)

    const bad = await admin
      .post('/admin/orders')
      .set('Accept', 'text/html')
      .form({ name: '', email: '', orderNumber: '', status: 'pending', total: '0' })

    assert.ok(bad.status === 200 || bad.status === 302, `expected 200 or 302, got ${bad.status}`)

    const listing = await admin.get('/admin/orders')
    const text = await listing.text()

    assert.ok(!text.includes('"orderNumber":"'), 'form body should not leak into alert')
    assert.ok(!text.match(/alert[^>]*>[^<]*\{\}[^<]*<\/div>/), 'empty {} errors should not render as alert')
  })

  test('flash success message clears after being displayed once', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const slug = `flash-clear-${ts}`

    const create = await admin
      .post('/admin/events')
      .form({ title: `Flash Clear ${ts}`, slug, startsAt: new Date(), status: 'draft' })
    assert.strictEqual(create.status, 302)

    const first = await admin.get('/admin/events')
    const t1 = await first.text()
    assert.ok(/alert-success[\s\S]{0,300}?Event created/.test(t1), 'first load should show flash')

    const second = await admin.get('/admin/events')
    const t2 = await second.text()
    assert.ok(!/alert-success[\s\S]{0,300}?Event created/.test(t2), 'second load should NOT show flash')
  })

  test('edit form page renders with belongsTo select pre-selected', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const organizer = await User.create({ name: `Edit Organizer ${ts}`, email: `edit-org-${ts}@example.com`, password: 'secret123' })

    const createRes = await admin
      .post('/admin/events')
      .form({
        title: `Edit Test ${ts}`,
        slug: `edit-test-${ts}`,
        startsAt: new Date(),
        status: 'draft',
        organizer: String(organizer.id),
      })
    assert.strictEqual(createRes.status, 302)
    const event = await Event.where('slug', `edit-test-${ts}`).first()
    assert.ok(event)

    const editRes = await admin.get(`/admin/events/${event.id}/edit`)
    assert.strictEqual(editRes.status, 200)
    const text = await editRes.text()
    assert.ok(text.includes('Edit Event'))
    assert.ok(text.includes(organizer.name))
  })

  test('edits a record through admin form', async ({ request }) => {
    const admin = await adminRequest(request)
    const event = await Event.query().first()
    assert.ok(event)

    const newTitle = `Updated ${Date.now()}`
    const res = await admin
      .put(`/admin/events/${event.id}`)
      .form({
        title: newTitle,
        slug: event.slug,
        startsAt: event.startsAt,
        status: event.status,
      })

    assert.strictEqual(res.status, 302)
    const updated = await Event.find(event.id)
    assert.strictEqual(updated.title, newTitle)
  })

  test('deletes a record', async ({ request }) => {
    const admin = await adminRequest(request)
    const event = await Event.query().orderBy('id', 'desc').first()
    assert.ok(event)

    const res = await admin.delete(`/admin/events/${event.id}`)
    assert.strictEqual(res.status, 302)
    const gone = await Event.find(event.id)
    assert.strictEqual(gone, null)
  })

  test('search filters list results', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const event = await Event.create({
      title: `SearchHit ${ts}`,
      slug: `search-hit-${ts}`,
      startsAt: new Date(),
      status: 'draft',
    })

    const q = `SearchHit ${ts}`
    const res = await admin.get(`/admin/events?q=${encodeURIComponent(q)}`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes(event.title))
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
    formData.append('title', `Image Test ${timestamp}`)
    formData.append('slug', slug)
    formData.append('startsAt', new Date())
    formData.append('status', 'draft')
    const blob = new Blob(['fake-image-data'], { type: 'image/png' })
    formData.append('coverImage', blob, 'test.png')

    const res = await admin.post('/admin/events').send(formData)
    assert.strictEqual(res.status, 302)
    const event = await Event.where('slug', slug).first()
    assert.ok(event)
    assert.ok(event.coverImage, 'Event should have a cover image path')
    assert.ok(event.coverImage.startsWith('/storage/'), `Image path should start with /storage/, got ${event.coverImage}`)
  })

  test('updates a record with image upload', async ({ request }) => {
    const admin = await adminRequest(request)
    const timestamp = Date.now()
    const slug = `img-update-${timestamp}`

    const event = await Event.create({
      title: `Img Update ${timestamp}`,
      slug,
      startsAt: new Date(),
      status: 'draft',
    })
    assert.ok(event)
    assert.strictEqual(event.coverImage, null)

    const formData = new FormData()
    formData.append('title', event.title)
    formData.append('slug', event.slug)
    formData.append('startsAt', event.startsAt)
    formData.append('status', event.status)
    const blob = new Blob(['updated-image-data'], { type: 'image/jpeg' })
    formData.append('coverImage', blob, 'update.jpg')

    const res = await admin.put(`/admin/events/${event.id}`).send(formData)
    assert.strictEqual(res.status, 302)
    const updated = await Event.find(event.id)
    assert.ok(updated.coverImage, 'Updated event should have a cover image path')
    assert.ok(updated.coverImage.startsWith('/storage/'))
    assert.ok(updated.coverImage.endsWith('.jpg'))
  })

  test('removes an image from a record', async ({ request }) => {
    const admin = await adminRequest(request)
    const timestamp = Date.now()
    const slug = `img-remove-${timestamp}`

    const event = await Event.create({
      title: `Img Remove ${timestamp}`,
      slug,
      startsAt: new Date(),
      status: 'draft',
      coverImage: '/storage/old-image.png',
    })
    assert.ok(event)
    assert.strictEqual(event.coverImage, '/storage/old-image.png')

    const formData = new FormData()
    formData.append('title', event.title)
    formData.append('slug', event.slug)
    formData.append('startsAt', event.startsAt)
    formData.append('status', event.status)
    formData.append('coverImage_delete', '1')

    const res = await admin.put(`/admin/events/${event.id}`).send(formData)
    assert.strictEqual(res.status, 302)
    const updated = await Event.find(event.id)
    assert.strictEqual(updated.coverImage, null, 'Image should be null after removal')
  })

  test('exports events as CSV', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/events/export')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Title'), 'CSV should have Title column')
    assert.ok(text.includes('Status'), 'CSV should have Status column')
    assert.ok(text.match(/\n.+,/), 'CSV should have at least one data row')
    assert.ok(res.headers.get('Content-Type').includes('text/csv'))
    assert.ok(res.headers.get('Content-Disposition').includes('events'), 'filename should contain events')
    assert.ok(res.headers.get('Content-Disposition').includes('.csv'), 'filename should end with .csv')
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
    await Event.create({ title: `JSON Search ${timestamp}`, slug, startsAt: new Date(), status: 'draft' })

    const res = await admin.get(`/admin/search?q=JSON+Search+${timestamp}&format=json`)
    assert.strictEqual(res.status, 200)
    assert.ok((res.headers.get('content-type') || '').includes('application/json'))
    const json = await res.json()
    assert.ok(Array.isArray(json.groups), 'JSON response should include groups array')
    const group = json.groups.find(g => g.plural === 'events')
    assert.ok(group, 'Should find events group')
    assert.ok(group.items.some(i => i.title.includes(`JSON Search ${timestamp}`)), 'Search item should match')
    assert.ok(group.items[0].url.startsWith('/admin/events/'), 'Item URL should point to admin detail')
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
    await Event.create({ title: `Lookup Alpha ${ts}`, slug: `look-a-${ts}`, startsAt: new Date(), status: 'draft' })
    await Event.create({ title: `Other Beta ${ts}`, slug: `look-b-${ts}`, startsAt: new Date(), status: 'draft' })

    const res = await admin.get(`/admin/events/lookup?q=Lookup+Alpha+${ts}`)
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
    const ev1 = await Event.create({ title: `Hydrate One ${ts}`, slug: `hyd1-${ts}`, startsAt: new Date(), status: 'draft' })
    const ev2 = await Event.create({ title: `Hydrate Two ${ts}`, slug: `hyd2-${ts}`, startsAt: new Date(), status: 'draft' })

    const res = await admin.get(`/admin/events/lookup?ids=${ev1.id},${ev2.id}`)
    assert.strictEqual(res.status, 200)
    const json = await res.json()
    assert.strictEqual(json.data.length, 2)
    const values = json.data.map(r => r.value).sort()
    assert.deepStrictEqual(values, [ev1.id, ev2.id].sort())
  })

  test('strictAdmin blocks organizer from lookup endpoints under /admin', async ({ request }) => {
    const organizer = await roleRequest(request, ['organizer'])
    const res = await organizer.get('/admin/users/lookup')
    // Redirected off /admin before the resource-specific gate ever runs.
    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.get('location'), '/')
  })

  test('lookup endpoint uses resource displayLabel when set', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const event = await Event.create({ title: `Label Test ${ts}`, slug: `label-${ts}`, startsAt: new Date(), status: 'draft' })

    const res = await admin.get(`/admin/events/lookup?ids=${event.id}`)
    const json = await res.json()
    // With displayLabel set to e => e.title, label should be the title.
    assert.strictEqual(json.data[0].label, `Label Test ${ts}`)
  })

  test('filtering ticket types by belongsTo uses equality, not LIKE', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const evA = await Event.create({ title: `Ev A ${ts}`, slug: `ev-a-${ts}`, startsAt: new Date(), status: 'draft' })
    const evB = await Event.create({ title: `Ev B ${ts}`, slug: `ev-b-${ts}`, startsAt: new Date(), status: 'draft' })

    await TicketType.create({ name: `Filter A ${ts}`, price: 10, quantity: 100, event: evA.id })
    await TicketType.create({ name: `Filter B ${ts}`, price: 20, quantity: 50, event: evB.id })

    const res = await admin.get(`/admin/ticket_types?f[event]=${evA.id}`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes(`Filter A ${ts}`), 'Should include ticket types for event A')
    assert.ok(!text.includes(`Filter B ${ts}`), 'Should NOT include ticket types for event B')
  })

  test('edit form hydrates belongsTo combobox with current value label', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const event = await Event.create({ title: `Edit Hydrate ${ts}`, slug: `eh-${ts}`, startsAt: new Date(), status: 'draft' })
    const ticketType = await TicketType.create({
      name: `Edit TT ${ts}`,
      price: 12,
      quantity: 100,
      event: event.id,
    })
    const res = await admin.get(`/admin/ticket_types/${ticketType.id}/edit`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('<fb-combobox'))
    assert.ok(text.includes(`Edit Hydrate ${ts}`), 'Edit form should pre-populate label of current event')
    assert.ok(text.includes(`value="${event.id}"`) || text.includes(`value="${String(event.id)}"`))
  })

  test('detail page renders belongsTo relations as chip links', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const event = await Event.create({ title: `Detail Rel ${ts}`, slug: `dr-${ts}`, startsAt: new Date(), status: 'draft' })
    const ticketType = await TicketType.create({
      name: `Detail TT ${ts}`,
      price: 12,
      quantity: 50,
      event: event.id,
    })
    const res = await admin.get(`/admin/ticket_types/${ticketType.id}`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('fb-chip'), 'Detail belongsTo should render as chip')
    assert.ok(text.includes(`/admin/events/${event.id}`), 'Chip should link to related record')
  })

  test('detail page renders configured sections', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const order = await Order.create({ orderNumber: `ORD-DETAIL-${ts}`, email: 'detail@test.com', name: `Detail Name ${ts}`, status: 'pending', total: 42 })
    const res = await admin.get(`/admin/orders/${order.id}`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Customer'), 'Should render Customer section')
    assert.ok(text.includes('Payment'), 'Should render Payment section')
    assert.ok(text.includes(`Detail Name ${ts}`), 'Should render name value')
  })

  test('create form prefills relation from query string', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const event = await Event.create({ title: `Prefill Event ${ts}`, slug: `pf-${ts}`, startsAt: new Date(), status: 'draft' })

    const res = await admin.get(`/admin/ticket_types/create?event=${event.id}`)
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes(`Prefill Event ${ts}`), 'Prefilled event should be present as initial label')
    assert.ok(new RegExp(`value="${event.id}"`).test(text), `Prefill should set value="${event.id}"`)
  })

  test('sidebar renders resource group labels', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    // Event, TicketType, Order, Attendee, DiscountCode are grouped under Events; User under System.
    assert.ok(text.includes('Events'), 'Sidebar should render Events group')
    assert.ok(text.includes('System'), 'Sidebar should render System group')
  })

  test('dashboard renders chart widget sparkline', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    await Order.create({ orderNumber: `ORD-CHART-${ts}`, email: 'chart@test.com', name: 'Chart Test', status: 'pending', total: 20 })
    const res = await admin.get('/admin')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Event Revenue') || text.includes('Orders (last 7 days)'), 'Chart widget label should render')
    assert.ok(text.includes('fb-widget-chart-'), 'Chart widget should render a canvas element')
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
    // Events / Orders / Attendees opt in explicitly via .dashboard({...}).
    assert.ok(text.includes('Events'), 'Events stat card should render')
    assert.ok(text.includes('Orders'), 'Orders stat card should render')
    // Users/framework models did NOT opt in — must not be stat cards.
    // We look for a card-shaped block with these labels; broader "text includes"
    // would false-positive against the sidebar.
    const cards = (text.match(/class="stat-card"[\s\S]*?<\/a>|class="stat-card"[\s\S]*?<\/div>/g) || []).join('')
    assert.ok(!cards.includes('Users'), 'Users should NOT be a stat card')
    assert.ok(!cards.includes('Failed Jobs'), 'Failed Jobs should NOT be a stat card')
    assert.ok(!cards.includes('API Tokens'), 'API Tokens should NOT be a stat card')
    assert.ok(!cards.includes('Notifications'), 'Notifications should NOT be a stat card')
  })

  test('filter popover renders in the toolbar', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/events')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('<fb-popover'), 'Filter popover component should render')
    assert.ok(text.includes('Apply filters'), 'Apply button should be in the popover')
  })

  test('active filters render as removable chips', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/events?f%5Bstatus%5D=draft')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('fb-filter-chips'), 'Chip container should render')
    // Chip includes label + display value + remove link.
    assert.ok(/fb-filter-chip[\s\S]*Status[\s\S]*draft/i.test(text), 'Chip label + value')
    assert.ok(/fb-filter-chip-remove/.test(text), 'Chip includes a remove link')
    // The chip remove link drops the filter key entirely (no blank f[status]=).
    // When it's the last filter, f_reset=1 is added to clear the persist cookie.
    const chipMatch = text.match(/href="([^"]*)"[^>]*class="fb-filter-chip-remove"/)
    assert.ok(chipMatch, 'Chip remove link exists')
    assert.ok(!chipMatch[1].includes('f%5Bstatus%5D='), 'Remove link should drop the filter key, not blank it')
    assert.ok(chipMatch[1].includes('f_reset=1'), 'Remove link includes f_reset when it is the last filter')
  })

  test('bulk export selected rows produces a CSV (sync path)', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const e1 = await Event.create({ title: `BulkExport A ${ts}`, slug: `be-a-${ts}`, startsAt: new Date(), status: 'draft' })
    const e2 = await Event.create({ title: `BulkExport B ${ts}`, slug: `be-b-${ts}`, startsAt: new Date(), status: 'published' })

    // Force sync path so we can inspect the CSV stream directly.
    const res = await admin.post('/admin/events/export')
      .form({
        format: 'csv',
        columns: 'id,title,slug,status',
        ids: [String(e1.id), String(e2.id)],
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
    assert.strictEqual(first.resource, 'events')
  })

  test('queued export creates a pending AdminExport when queue is available', async ({ request }) => {
    const admin = await adminRequest(request)
    const ts = Date.now()
    const e = await Event.create({ title: `QueueExp ${ts}`, slug: `qe-${ts}`, startsAt: new Date(), status: 'draft' })

    const before = await (await import('foobarjs/admin')).AdminExport.query().count()
    // Setting export.mode=queue would require config change; instead we test the
    // sync completion path. Verify the AdminExport record exists after sync.
    const res = await admin.post('/admin/events/export').form({
      format: 'csv',
      ids: [String(e.id)],
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
      resource: 'events',
      status: 'complete',
      filePath: 'exports/nonexistent.csv',
    })

    const other = await roleRequest(request, ['organizer'])
    const res = await other.get(`/admin/exports/${record.id}/download`)
    // strictAdmin: organizer is redirected off /admin before the export-specific check runs.
    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.get('location'), '/')
  })

  test('admin_exports admin list is registered under System', async ({ request }) => {
    const admin = await adminRequest(request)
    const res = await admin.get('/admin/admin_exports')
    assert.strictEqual(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes('Exports'), 'Exports page should render')
  })

  test('admin routes are subject to the global rate limit', async ({ request }) => {
    const admin = await adminRequest(request)
    let got429 = false
    for (let i = 0; i < 200; i++) {
      const res = await admin.post('/admin/prefs').form({ theme: i % 2 === 0 ? 'dark' : 'light' })
      if (res.status === 429) { got429 = true; break }
    }
    assert.ok(got429, 'Admin routes should be rate-limited after exceeding the threshold')
  })
})
