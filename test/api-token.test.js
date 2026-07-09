import { test, describe, assert, before, boot } from 'foobarjs/test'
import { PersonalAccessToken } from 'foobarjs/auth'
import User from '../app/models/user.model.js'

before(async () => {
  await boot()
})

describe('API Token Authentication', () => {
  test('authenticates API request with Bearer token', async ({ request }) => {
    const timestamp = Date.now()
    const user = await User.create({
      name: 'API User',
      email: `api-${timestamp}@example.com`,
      password: 'secret123',
    })
    user.forceFill({ isAdmin: true })
    await user.save()

    const { plainTextToken } = await PersonalAccessToken.createFor(user, 'test-token')

    const res = await request
      .get('/admin/products')
      .set('Authorization', `Bearer ${plainTextToken}`)

    const text = await res.text()
    assert.strictEqual(res.status, 200)
    assert.ok(text.includes('Products'))
  })

  test('rejects invalid Bearer token', async ({ request }) => {
    const res = await request
      .get('/admin/products')
      .set('Authorization', 'Bearer invalid-token')

    assert.strictEqual(res.status, 302)
    assert.ok(res.headers.get('location')?.includes('/login'))
  })

  test('rejects expired token', async ({ request }) => {
    const timestamp = Date.now()
    const user = await User.create({
      name: 'Expired API User',
      email: `expired-${timestamp}@example.com`,
      password: 'secret123',
    })
    user.forceFill({ isAdmin: true })
    await user.save()

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const { plainTextToken } = await PersonalAccessToken.createFor(user, 'expired-token', ['*'], yesterday)

    const res = await request
      .get('/admin/products')
      .set('Authorization', `Bearer ${plainTextToken}`)

    assert.strictEqual(res.status, 302)
    assert.ok(res.headers.get('location')?.includes('/login'))
  })
})
