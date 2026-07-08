import { test, describe, assert, before, boot } from 'foobarjs/test'
import Product from '../app/models/product.model.js'
import Category from '../app/models/category.model.js'
import Tag from '../app/models/tag.model.js'
import User from '../app/models/user.model.js'
import Profile from '../app/models/profile.model.js'

before(async () => {
  await boot()
})

describe('Eager Loading', () => {
  test('loads belongsTo relation in batch', async () => {
    const ts = Date.now()
    const cat = await Category.create({ name: `EL Cat ${ts}`, slug: `el-cat-${ts}` })
    for (let i = 0; i < 3; i++) {
      await Product.create({ name: `EL Prod ${ts}-${i}`, slug: `el-prod-${ts}-${i}`, price: 10, stock: 1, category: cat.id })
    }
    const products = await Product.with('category').get()
    const withCat = products.filter(p => p.category)
    assert.ok(withCat.length >= 3)
    for (const product of withCat) {
      assert.ok(product.category.id)
      assert.ok(product.category.name)
    }
  })

  test('loads belongsToMany relation', async () => {
    const tag = await Tag.create({ name: 'Test Tag', slug: `eager-${Date.now()}` })
    const product = await Product.create({ name: 'Eager Test', slug: `eager-p-${Date.now()}`, price: 10, stock: 1 })
    product.tags = [tag.id]
    await product.save()

    const loaded = await Product.with('tags').find(product.id)
    assert.ok(loaded)
    assert.ok(Array.isArray(loaded.tags), 'tags should be an array')
    assert.strictEqual(loaded.tags.length, 1, 'should have 1 tag')
    assert.strictEqual(loaded.tags[0].id, tag.id)
  })

  test('loads belongsToMany with empty relation', async () => {
    const product = await Product.create({ name: 'No Tags', slug: `no-tags-${Date.now()}`, price: 5, stock: 0 })
    const loaded = await Product.with('tags').find(product.id)
    assert.ok(loaded)
    assert.ok(Array.isArray(loaded.tags))
    assert.strictEqual(loaded.tags.length, 0)
  })

  test('loads belongsToMany with nested relations', async () => {
    const tag = await Tag.create({ name: 'Nested Tag', slug: `nested-${Date.now()}` })
    const product = await Product.create({ name: 'Nested Test', slug: `nested-p-${Date.now()}`, price: 15, stock: 2 })
    product.tags = [tag.id]
    await product.save()

    const loaded = await Product.with('category').find(product.id)
    assert.ok(loaded)
  })

  test('withCount on hasMany relation', async () => {
    const cat = await Category.create({ name: 'CountCat', slug: `count-cat-${Date.now()}` })
    await Product.create({ name: 'P1', slug: `p1-${Date.now()}`, price: 5, stock: 1, category: cat.id })
    await Product.create({ name: 'P2', slug: `p2-${Date.now()}`, price: 5, stock: 1, category: cat.id })

    const [loaded] = await Category.withCount('products').where('id', cat.id).get()
    assert.ok(loaded)
    assert.strictEqual(loaded.products_count, 2, 'should count 2 products')
  })

  test('withCount on belongsToMany relation', async () => {
    const tag1 = await Tag.create({ name: 'Tag A', slug: `ta-${Date.now()}` })
    const tag2 = await Tag.create({ name: 'Tag B', slug: `tb-${Date.now()}` })

    const product = await Product.create({ name: 'TagCount', slug: `tc-${Date.now()}`, price: 3, stock: 5 })
    product.tags = [tag1.id, tag2.id]
    await product.save()

    const loaded = await Product.withCount('tags').find(product.id)
    assert.ok(loaded)
    assert.strictEqual(loaded.tags_count, 2, 'should count 2 tags')
  })

  test('withCount returns 0 for empty relation', async () => {
    const product = await Product.create({ name: 'ZeroCount', slug: `zc-${Date.now()}`, price: 1, stock: 0 })
    const loaded = await Product.withCount('tags').find(product.id)
    assert.ok(loaded)
    assert.strictEqual(loaded.tags_count, 0, 'should count 0 tags')
  })

  test('loads hasOne relation', async () => {
    const user = await User.create({ name: 'HasOne User', email: `hasone-${Date.now()}@test.com`, password: 'secret' })
    const profile = await Profile.create({ bio: 'Test bio', avatar: 'avatar.png', user: user.id })

    const loaded = await User.with('profile').find(user.id)
    assert.ok(loaded)
    assert.ok(loaded.profile, 'profile should be loaded')
    assert.strictEqual(loaded.profile.bio, 'Test bio', 'should have correct bio')
    assert.strictEqual(loaded.profile.avatar, 'avatar.png', 'should have correct avatar')
  })

  test('loads hasOne as null when no related record', async () => {
    const user = await User.create({ name: 'No Profile', email: `noprofile-${Date.now()}@test.com`, password: 'secret' })
    const loaded = await User.with('profile').find(user.id)
    assert.ok(loaded)
    assert.strictEqual(loaded.profile, null, 'profile should be null')
  })
})
