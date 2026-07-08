import { test, describe, assert, before, boot } from 'foobarjs/test'
import { Cache, CacheEntry } from 'foobarjs/cache'
import { RedisManager } from 'foobarjs/redis'

let redisAvailable = false

async function checkRedis() {
  return RedisManager.isAvailable(null, 1000)
}

before(async () => {
  await boot()
  redisAvailable = await checkRedis()
})

describe('Cache', () => {
  test('redis driver stores and retrieves value', async () => {
    if (!redisAvailable) return assert.ok(true, 'redis unavailable')
    await Cache.store('redis').put('redis-greeting', 'hello', 60)
    const value = await Cache.store('redis').get('redis-greeting')
    assert.strictEqual(value, 'hello')
  })

  test('redis driver forgets key', async () => {
    if (!redisAvailable) return assert.ok(true, 'redis unavailable')
    await Cache.store('redis').put('redis-temp', 'value', 60)
    await Cache.store('redis').forget('redis-temp')
    const value = await Cache.store('redis').get('redis-temp')
    assert.strictEqual(value, null)
  })

  test('redis driver expires value after ttl', async () => {
    if (!redisAvailable) return assert.ok(true, 'redis unavailable')
    await Cache.store('redis').put('redis-short', 'value', 1)
    await new Promise(resolve => setTimeout(resolve, 1100))
    const value = await Cache.store('redis').get('redis-short', 'expired')
    assert.strictEqual(value, 'expired')
  })

  test('database driver stores and retrieves value', async () => {
    await Cache.store('database').put('greeting', 'hello', 60)
    const value = await Cache.store('database').get('greeting')
    assert.strictEqual(value, 'hello')
  })

  test('database driver returns default when missing', async () => {
    const value = await Cache.store('database').get('missing-key', 'fallback')
    assert.strictEqual(value, 'fallback')
  })

  test('database driver forgets key', async () => {
    await Cache.store('database').put('temp', 'value', 60)
    await Cache.store('database').forget('temp')
    const value = await Cache.store('database').get('temp')
    assert.strictEqual(value, null)
  })

  test('database driver expires value after ttl', async () => {
    await Cache.store('database').put('short', 'value', 1)
    await new Promise(resolve => setTimeout(resolve, 1100))
    const value = await Cache.store('database').get('short', 'expired')
    assert.strictEqual(value, 'expired')
  })

  test('database driver remember executes callback once', async () => {
    let calls = 0
    const value1 = await Cache.store('database').remember('remember-test', 60, async () => {
      calls += 1
      return 'computed'
    })
    const value2 = await Cache.store('database').remember('remember-test', 60, async () => {
      calls += 1
      return 'computed-again'
    })
    assert.strictEqual(value1, 'computed')
    assert.strictEqual(value2, 'computed')
    assert.strictEqual(calls, 1)
  })

  test('memory driver stores and retrieves value', async () => {
    await Cache.store('memory').put('mem-key', { foo: 'bar' }, 60)
    const value = await Cache.store('memory').get('mem-key')
    assert.deepStrictEqual(value, { foo: 'bar' })
  })

  test('file driver stores and retrieves value', async () => {
    await Cache.store('file').put('file-key', [1, 2, 3], 60)
    const value = await Cache.store('file').get('file-key')
    assert.deepStrictEqual(value, [1, 2, 3])
  })
})
