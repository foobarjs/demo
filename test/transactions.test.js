import { test, describe, assert, before, boot } from 'foobarjs/test'
import { Model } from 'foobarjs/orm'
import Product from '../app/models/product.model.js'
import Category from '../app/models/category.model.js'

before(async () => {
  await boot()
})

describe('Transactions', () => {
  test('rolls back on error', async () => {
    const slug = `rollback-${Date.now()}`

    try {
      await Model.transaction(async () => {
        await Product.create({ name: 'Rollback Product', slug, price: 9.99, stock: 1 })
        throw new Error('Intentional rollback')
      })
    } catch (err) {
      assert.strictEqual(err.message, 'Intentional rollback')
    }

    const created = await Product.where('slug', slug).first()
    assert.strictEqual(created, null)
  })

  test('commits when successful', async () => {
    const ts = Date.now()
    const category = await Category.create({ name: `Txn Cat ${ts}`, slug: `txn-cat-${ts}` })
    const slug = `committed-${ts}`

    await Model.transaction(async () => {
      await Product.create({
        name: 'Committed Product',
        slug,
        price: 19.99,
        stock: 5,
        category: category.id,
        published: true,
      })
    })

    const created = await Product.where('slug', slug).first()
    assert.ok(created)
  })
})
