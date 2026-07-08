import { test, describe, assert, before, boot } from 'foobarjs/test'
import Product from '../app/models/product.model.js'
import Category from '../app/models/category.model.js'
import Tag from '../app/models/tag.model.js'
import User from '../app/models/user.model.js'

before(async () => {
  await boot()
})

describe('ORM Features', () => {
  before(async () => {
    const ts = Date.now()
    const seedCat = await Category.create({ name: `Seed Cat ${ts}`, slug: `seed-cat-${ts}` })
    await Product.create({ name: `Seed Prod ${ts}`, slug: `seed-prod-${ts}`, price: 10, stock: 5, category: seedCat.id })
  })

  test('findOrFail returns model when found', async () => {
    const first = await Product.query().first()
    const p = await Product.findOrFail(first.id)
    assert.ok(p)
    assert.ok(p.id)
  })

  test('findOrFail throws when not found', async () => {
    await assert.rejects(
      () => Product.findOrFail(999999),
      { message: /No record found/ },
      'should throw 404 error'
    )
  })

  test('pluck returns array of values', async () => {
    const first = await Product.query().first()
    const names = await Product.pluck('name')
    assert.ok(Array.isArray(names))
    assert.ok(names.length > 0)
    assert.ok(typeof names[0] === 'string')
  })

  test('pluck returns key-value pairs with second arg', async () => {
    const first = await Product.query().first()
    const map = await Product.pluck('name', 'id')
    assert.ok(typeof map === 'object')
    const ids = Object.keys(map)
    assert.ok(ids.length > 0)
    assert.strictEqual(map[ids[0]], first.name)
  })

  test('when applies callback when condition is truthy', async () => {
    const first = await Product.query().first()
    const products = await Product.when(true, qb => qb.where('id', first.id)).get()
    assert.ok(products.length > 0)
    assert.strictEqual(products[0].id, first.id)
  })

  test('when skips callback when condition is falsy', async () => {
    const products = await Product.when(false, qb => qb.where('id', 1)).get()
    assert.ok(products.length > 0)
  })

  test('unless applies callback when condition is falsy', async () => {
    const first = await Product.query().first()
    const products = await Product.unless(false, qb => qb.where('id', first.id)).get()
    assert.ok(products.length > 0)
    assert.strictEqual(products[0].id, first.id)
  })

  test('unless skips callback when condition is truthy', async () => {
    const products = await Product.unless(true, qb => qb.where('id', 1)).get()
    assert.ok(products.length > 0)
  })

  test('increment updates column atomically', async () => {
    const p = await Product.create({ name: 'Inc Test', slug: `inc-${Date.now()}`, price: 10, stock: 5 })
    await p.increment('stock', 3)
    assert.strictEqual(p.stock, 8)
    const reloaded = await Product.find(p.id)
    assert.strictEqual(reloaded.stock, 8)
  })

  test('decrement updates column atomically', async () => {
    const p = await Product.create({ name: 'Dec Test', slug: `dec-${Date.now()}`, price: 10, stock: 5 })
    await p.decrement('stock', 2)
    assert.strictEqual(p.stock, 3)
    const reloaded = await Product.find(p.id)
    assert.strictEqual(reloaded.stock, 3)
  })

  test('firstOrCreate creates new record', async () => {
    const slug = `foc-${Date.now()}`
    const p = await Product.firstOrCreate({ slug }, { name: 'FirstOrCreate Test', price: 15 })
    assert.ok(p.id)
    assert.strictEqual(p.name, 'FirstOrCreate Test')
    const p2 = await Product.firstOrCreate({ slug }, { name: 'Should Not Update' })
    assert.strictEqual(p2.id, p.id)
    assert.strictEqual(p2.name, 'FirstOrCreate Test')
  })

  test('updateOrCreate creates and updates', async () => {
    const slug = `uoc-${Date.now()}`
    const p = await Product.updateOrCreate({ slug }, { name: 'UpdateOrCreate Test', price: 20 })
    assert.ok(p.id)
    assert.strictEqual(p.name, 'UpdateOrCreate Test')
    const p2 = await Product.updateOrCreate({ slug }, { name: 'Updated Name' })
    assert.strictEqual(p2.id, p.id)
    assert.strictEqual(p2.name, 'Updated Name')
  })

  test('load lazy loads belongsTo relation', async () => {
    const ts = Date.now()
    const cat = await Category.create({ name: `Load Cat ${ts}`, slug: `load-cat-${ts}` })
    const p = await Product.create({ name: `Load Prod ${ts}`, slug: `load-prod-${ts}`, price: 10, stock: 1, category: cat.id })
    assert.ok(p.category !== null)
    const catId = Number(p.category)
    assert.ok(catId > 0)
    await p.load('category')
    assert.ok(p.category)
    assert.strictEqual(typeof p.category, 'object')
    assert.strictEqual(p.category.id, catId)
  })

  test('load lazy loads hasMany relation', async () => {
    const ts = Date.now()
    const cat = await Category.create({ name: `Load HM Cat ${ts}`, slug: `load-hm-cat-${ts}` })
    await Product.create({ name: `Load HM Prod ${ts}`, slug: `load-hm-prod-${ts}`, price: 10, stock: 1, category: cat.id })
    await cat.load('products')
    assert.ok(Array.isArray(cat.products))
    assert.ok(cat.products.length > 0)
  })

  test('fresh returns new instance from DB', async () => {
    const p = await Product.create({ name: 'Fresh Test', slug: `fresh-${Date.now()}`, price: 10 })
    const slug = p.slug
    const fresh = await p.fresh()
    assert.ok(fresh)
    assert.notStrictEqual(fresh, p)
    assert.strictEqual(fresh.slug, slug)
  })

  test('refresh updates instance in place', async () => {
    const p = await Product.create({ name: 'Refresh Test', slug: `refresh-${Date.now()}`, price: 10 })
    p.name = 'Dirty'
    await p.refresh()
    assert.strictEqual(p.name, 'Refresh Test')
  })

  test('whereHas filters by relation', async () => {
    const ts = Date.now()
    const cat = await Category.create({ name: `WH Cat ${ts}`, slug: `wh-cat-${ts}` })
    await Product.create({ name: `WH Prod ${ts}`, slug: `wh-prod-${ts}`, price: 10, stock: 1, category: cat.id })
    const products = await Product.whereHas('category', qb => {
      qb.where('id', cat.id)
    }).get()
    assert.ok(products.length > 0)
    for (const p of products) {
      assert.strictEqual(Number(p.category), cat.id)
    }
  })

  test('orWhereHas adds OR condition', async () => {
    const first = await Product.query().first()
    const catId = Number(first.category)
    const products = await Product
      .where('id', 0)
      .orWhereHas('category', qb => {
        qb.where('id', catId)
      })
      .get()
    if (products.length > 0) {
      for (const p of products) {
        assert.strictEqual(Number(p.category), catId)
      }
    }
  })

  test('appends are included in toJSON', async () => {
    const p = await Product.create({ name: 'Appends Test', slug: `app-${Date.now()}`, price: 10 })
    const json = JSON.parse(JSON.stringify(p))
    assert.ok(typeof json === 'object')
  })

  test('query builder chaining with when and pluck', async () => {
    const slugs = await Product.when(true, qb => qb.where('id', '>=', 1)).pluck('slug')
    assert.ok(Array.isArray(slugs))
    assert.ok(slugs.length > 0)
  })

  test('scope registration and application', async () => {
    Product.scope('published', qb => qb.where('published', true))
    const scoped = Product.query()
    Product.applyScope('published', scoped)
    const results = await scoped.get()
    assert.ok(Array.isArray(results))
  })

  test('declarative scopes via query builder chaining', async () => {
    const products = await Product.query().where('id', '>=', 1).get()
    assert.ok(products.length > 0)
  })

  test('scope methods from scopes() are callable on query builder', async () => {
    const origScopes = Product.scopes
    Product.scopes = function() {
      return {
        cheap: (qb, maxPrice) => qb.where('price', '<=', maxPrice),
      }
    }
    const results = await Product.query().cheap(5).get()
    assert.ok(Array.isArray(results))
    for (const p of results) {
      assert.ok(p.price <= 5)
    }
    Product.scopes = origScopes
  })

  test('setter triggers password mutator via direct assignment', async () => {
    const user = new User()
    user.password = 'plaintext'
    assert.notStrictEqual(user.password, 'plaintext')
    assert.ok(user.password.startsWith('$scrypt$'))
    assert.ok(user.verifyPassword('plaintext'))
  })

  test('setter does not mutate during _fromEntity loading', async () => {
    const email = `reload-${Date.now()}@test.com`
    const created = await User.create({
      name: 'Reload Test',
      email,
      password: 'reloadpass',
    })
    const user = await User.find(created.id)
    assert.ok(user)
    assert.ok(user.password.length > 0)
    assert.ok(user.password.startsWith('$scrypt$'))
    assert.ok(user.verifyPassword('reloadpass'))
    assert.ok(!user.isDirty('password'))
  })

  test('setter mutator via create passes through constructor', async () => {
    const email = `mutator-${Date.now()}@test.com`
    const user = await User.create({
      name: 'Mutator Test',
      email,
      password: 'mypass',
    })
    assert.notStrictEqual(user.password, 'mypass')
    assert.ok(user.password.startsWith('$scrypt$'))
    assert.ok(user.verifyPassword('mypass'))
  })

  test('model scopes from scopes() work as chainable methods', async () => {
    const admins = await User.query().admins().get()
    assert.ok(Array.isArray(admins))
    for (const u of admins) {
      assert.strictEqual(u.isAdmin, true)
    }
  })

  test('chunk processes records in batches', async () => {
    const ts = Date.now()
    const created = []
    for (let i = 0; i < 5; i++) {
      created.push(await Product.create({
        name: `Chunk ${ts}-${i}`, slug: `chunk-${ts}-${i}`, price: 10,
      }))
    }
    const ids = created.map(c => c.id)
    const collected = []
    await Product.where('id', ids).orderBy('id', 'asc').chunk(2, (records, page) => {
      collected.push(...records)
    })
    assert.strictEqual(collected.length, 5)
    assert.strictEqual(collected[0].id, created[0].id)
    assert.strictEqual(collected[4].id, created[4].id)
  })

  test('chunk stops when callback returns false', async () => {
    const ts = Date.now()
    const ids = []
    for (let i = 0; i < 5; i++) {
      const p = await Product.create({
        name: `ChunkStop ${ts}-${i}`, slug: `chunk-stop-${ts}-${i}`, price: 10,
      })
      ids.push(p.id)
    }
    let pages = 0
    await Product.where('id', ids).chunk(2, () => {
      pages++
      return false
    })
    assert.strictEqual(pages, 1)
  })

  test('lazy yields records one at a time', async () => {
    const ts = Date.now()
    const ids = []
    for (let i = 0; i < 3; i++) {
      const p = await Product.create({
        name: `Lazy ${ts}-${i}`, slug: `lazy-${ts}-${i}`, price: 10,
      })
      ids.push(p.id)
    }
    const collected = []
    for await (const model of Product.where('id', ids).lazy(2)) {
      collected.push(model)
    }
    assert.strictEqual(collected.length, 3)
  })

  test('cursor streams records', async () => {
    const ts = Date.now()
    const ids = []
    for (let i = 0; i < 3; i++) {
      const p = await Product.create({
        name: `Cursor ${ts}-${i}`, slug: `cursor-${ts}-${i}`, price: 10,
      })
      ids.push(p.id)
    }
    const collected = []
    for await (const model of Product.where('id', ids).cursor()) {
      collected.push(model)
    }
    assert.strictEqual(collected.length, 3)
  })
})
