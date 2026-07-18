import { test, describe, assert, before, boot } from 'foobarjs/test'
import Product from '../app/models/product.model.js'
import Category from '../app/models/category.model.js'
import Order from '../app/models/order.model.js'
import User from '../app/models/user.model.js'
import Tag from '../app/models/tag.model.js'

before(async () => {
  await boot()
})

describe('ORM Aggregates', () => {
  const suiteTs = Date.now()
  let categoryA, categoryB

  before(async () => {
    categoryA = await Category.create({ name: `AggCatA ${suiteTs}`, slug: `agg-cat-a-${suiteTs}` })
    categoryB = await Category.create({ name: `AggCatB ${suiteTs}`, slug: `agg-cat-b-${suiteTs}` })
    for (let i = 0; i < 3; i++) {
      await Product.create({
        name: `AggProd ${suiteTs}-${i}`,
        slug: `agg-prod-${suiteTs}-${i}`,
        price: (i + 1) * 10,
        stock: i,
        category: categoryA.id,
      })
    }
    for (let i = 0; i < 2; i++) {
      await Product.create({
        name: `AggProdB ${suiteTs}-${i}`,
        slug: `agg-prod-b-${suiteTs}-${i}`,
        price: 100,
        stock: 5,
        category: categoryB.id,
      })
    }
  })

  test('Model.count returns total row count', async () => {
    const count = await Product.count()
    assert.ok(typeof count === 'number')
    assert.ok(count >= 5)
  })

  test('query().count filters by where', async () => {
    const count = await Product.query().where('category', categoryA.id).count()
    assert.strictEqual(count, 3)
  })

  test('Model.sum computes sum', async () => {
    const total = await Product.query().where('category', categoryB.id).sum('price')
    assert.strictEqual(total, 200)
  })

  test('Model.avg computes average', async () => {
    const avg = await Product.query().where('category', categoryA.id).avg('price')
    assert.strictEqual(avg, 20)
  })

  test('Model.min returns minimum', async () => {
    const min = await Product.query().where('category', categoryA.id).min('price')
    assert.strictEqual(min, 10)
  })

  test('Model.max returns maximum', async () => {
    const max = await Product.query().where('category', categoryA.id).max('price')
    assert.strictEqual(max, 30)
  })

  test('query().exists returns true when rows match', async () => {
    const exists = await Product.query().where('category', categoryA.id).exists()
    assert.strictEqual(exists, true)
  })

  test('query().exists returns false when no rows match', async () => {
    const exists = await Product.query().where('slug', 'never-ever-slug-xxxxxx').exists()
    assert.strictEqual(exists, false)
  })

  test('query().doesntExist inverts exists', async () => {
    const doesnt = await Product.query().where('slug', 'never-ever-slug-xxxxxx').doesntExist()
    assert.strictEqual(doesnt, true)
  })

  test('query().value returns single column value', async () => {
    const price = await Product.query().where('category', categoryB.id).value('price')
    assert.strictEqual(price, 100)
  })

  test('count with distinct removes duplicates', async () => {
    const distinctCats = await Product.query().distinct().count('category')
    assert.ok(distinctCats >= 2)
  })

  test('aggregates respect soft delete', async () => {
    const before = await Product.query().count()
    assert.ok(before >= 5)
  })
})

describe('ORM Filter Primitives', () => {
  const suiteTs = Date.now()
  let ids = []

  before(async () => {
    for (let i = 0; i < 4; i++) {
      const p = await Product.create({
        name: `FilterProd ${suiteTs}-${i}`,
        slug: `filter-prod-${suiteTs}-${i}`,
        price: (i + 1) * 5,
        stock: i,
      })
      ids.push(p.id)
    }
  })

  test('whereIn matches values in list', async () => {
    const items = await Product.query().whereIn('id', [ids[0], ids[1]]).get()
    assert.strictEqual(items.length, 2)
  })

  test('whereNotIn excludes values in list', async () => {
    const items = await Product.query().whereIn('id', ids).whereNotIn('id', [ids[0]]).get()
    assert.strictEqual(items.length, 3)
  })

  test('whereNull matches null values', async () => {
    const items = await Product.query().whereIn('id', ids).whereNull('description').get()
    assert.ok(items.length >= 4)
  })

  test('whereNotNull excludes null values', async () => {
    const p = await Product.create({
      name: `NotNullProd ${suiteTs}`,
      slug: `notnull-${suiteTs}`,
      description: 'has desc',
      price: 1,
    })
    const items = await Product.query().where('id', p.id).whereNotNull('description').get()
    assert.strictEqual(items.length, 1)
  })

  test('whereBetween matches range', async () => {
    const items = await Product.query()
      .whereIn('id', ids)
      .whereBetween('price', [10, 15])
      .get()
    assert.strictEqual(items.length, 2)
  })

  test('whereNotBetween excludes range', async () => {
    const items = await Product.query()
      .whereIn('id', ids)
      .whereNotBetween('price', [10, 15])
      .get()
    assert.strictEqual(items.length, 2)
  })

  test('whereColumn compares two columns', async () => {
    const p = await Product.create({
      name: `ColProd ${suiteTs}`,
      slug: `col-${suiteTs}`,
      price: 5,
      stock: 5,
    })
    const items = await Product.query().where('id', p.id).whereColumn('price', '=', 'stock').get()
    assert.strictEqual(items.length, 1)
  })

  test('whereRaw with bindings works', async () => {
    const items = await Product.query().whereRaw('price > ?', [30]).get()
    assert.ok(Array.isArray(items))
  })

  test('closure-scoped nested where builds AND(OR) group', async () => {
    const items = await Product.query()
      .whereIn('id', ids)
      .where(qb => qb.where('price', 5).orWhere('price', 20))
      .get()
    assert.strictEqual(items.length, 2)
  })
})

describe('ORM Multi-column OrderBy', () => {
  const suiteTs = Date.now()
  let ids = []

  before(async () => {
    ids.push((await Product.create({ name: `Sort ${suiteTs} A`, slug: `sort-${suiteTs}-a`, price: 10, stock: 2 })).id)
    ids.push((await Product.create({ name: `Sort ${suiteTs} B`, slug: `sort-${suiteTs}-b`, price: 10, stock: 1 })).id)
    ids.push((await Product.create({ name: `Sort ${suiteTs} C`, slug: `sort-${suiteTs}-c`, price: 20, stock: 3 })).id)
  })

  test('multi-column orderBy sorts by both', async () => {
    const items = await Product.query()
      .whereIn('id', ids)
      .orderBy('price', 'asc')
      .orderBy('stock', 'asc')
      .get()
    assert.strictEqual(items[0].id, ids[1])
    assert.strictEqual(items[1].id, ids[0])
    assert.strictEqual(items[2].id, ids[2])
  })

  test('latest() sorts by createdAt desc', async () => {
    const items = await Product.query().whereIn('id', ids).latest('createdAt').get()
    assert.strictEqual(items.length, 3)
  })

  test('oldest() sorts by createdAt asc', async () => {
    const items = await Product.query().whereIn('id', ids).oldest('createdAt').get()
    assert.strictEqual(items.length, 3)
  })

  test('reorder() clears previous orderBy', async () => {
    const items = await Product.query().whereIn('id', ids).orderBy('id', 'desc').reorder().orderBy('id', 'asc').get()
    assert.strictEqual(items[0].id, ids[0])
  })
})

describe('ORM GroupBy and HAVING', () => {
  const suiteTs = Date.now()
  let categoryA, categoryB

  before(async () => {
    categoryA = await Category.create({ name: `GrpA ${suiteTs}`, slug: `grp-a-${suiteTs}` })
    categoryB = await Category.create({ name: `GrpB ${suiteTs}`, slug: `grp-b-${suiteTs}` })
    for (let i = 0; i < 3; i++) {
      await Product.create({ name: `GrpP ${suiteTs}-${i}`, slug: `grp-p-${suiteTs}-${i}`, price: 5, category: categoryA.id })
    }
    for (let i = 0; i < 2; i++) {
      await Product.create({ name: `GrpQ ${suiteTs}-${i}`, slug: `grp-q-${suiteTs}-${i}`, price: 10, category: categoryB.id })
    }
  })

  test('groupBy returns aggregated rows', async () => {
    const rows = await Product.query()
      .whereIn('category', [categoryA.id, categoryB.id])
      .groupBy('category')
      .selectCount('*', 'count')
      .get()
    assert.strictEqual(rows.length, 2)
    for (const row of rows) {
      assert.ok(typeof row.count === 'number')
    }
  })

  test('groupBy with sum aggregate', async () => {
    const rows = await Product.query()
      .whereIn('category', [categoryA.id, categoryB.id])
      .groupBy('category')
      .selectSum('price', 'total')
      .get()
    assert.strictEqual(rows.length, 2)
    const byCat = new Map()
    for (const row of rows) byCat.set(row.category_id, row.total)
    assert.strictEqual(byCat.get(categoryA.id), 15)
    assert.strictEqual(byCat.get(categoryB.id), 20)
  })

  test('having filters grouped results', async () => {
    const rows = await Product.query()
      .whereIn('category', [categoryA.id, categoryB.id])
      .groupBy('category')
      .selectCount('*', 'cnt')
      .having('cnt', '>', 2)
      .get()
    assert.strictEqual(rows.length, 1)
    assert.strictEqual(rows[0].category_id, categoryA.id)
  })
})

describe('ORM Date Bucketing', () => {
  test('groupByDay returns per-day buckets', async () => {
    const rows = await Product.query()
      .groupByDay('createdAt')
      .selectCount('*', 'cnt')
      .get()
    assert.ok(Array.isArray(rows))
    assert.ok(rows.length > 0)
    for (const row of rows) {
      assert.ok(row.bucket, 'row should have bucket')
      assert.ok(typeof row.cnt === 'number')
    }
  })

  test('groupByMonth returns per-month buckets', async () => {
    const rows = await Product.query()
      .groupByMonth('createdAt')
      .selectCount('*', 'cnt')
      .get()
    assert.ok(Array.isArray(rows))
    for (const row of rows) {
      assert.ok(row.bucket, 'row should have bucket')
    }
  })

  test('groupByYear returns per-year buckets', async () => {
    const rows = await Product.query()
      .groupByYear('createdAt')
      .selectCount('*', 'cnt')
      .get()
    assert.ok(Array.isArray(rows))
    assert.ok(rows.length > 0)
  })

  test('groupByDay with sum on price', async () => {
    const rows = await Product.query()
      .groupByDay('createdAt')
      .selectSum('price', 'total')
      .get()
    for (const row of rows) {
      assert.ok(row.bucket)
      assert.ok(typeof row.total === 'number')
    }
  })
})

describe('ORM Bulk Operations', () => {
  const suiteTs = Date.now()

  test('insertMany creates multiple rows', async () => {
    const count = await Product.insertMany([
      { name: `Bulk ${suiteTs} 1`, slug: `bulk-${suiteTs}-1`, price: 1, stock: 0 },
      { name: `Bulk ${suiteTs} 2`, slug: `bulk-${suiteTs}-2`, price: 2, stock: 0 },
      { name: `Bulk ${suiteTs} 3`, slug: `bulk-${suiteTs}-3`, price: 3, stock: 0 },
    ])
    assert.strictEqual(count, 3)
    const found = await Product.query().where('slug', 'like', `bulk-${suiteTs}-%`).get()
    assert.strictEqual(found.length, 3)
  })

  test('updateAll updates matching rows', async () => {
    const ts = Date.now() + 1
    const ids = []
    for (let i = 0; i < 3; i++) {
      ids.push((await Product.create({ name: `Upd ${ts}-${i}`, slug: `upd-${ts}-${i}`, price: 5, stock: 0 })).id)
    }
    await Product.query().whereIn('id', ids).updateAll({ stock: 99 })
    for (const id of ids) {
      const fresh = await Product.find(id)
      assert.strictEqual(fresh.stock, 99)
    }
  })

  test('deleteAll removes matching rows', async () => {
    const ts = Date.now() + 2
    const ids = []
    for (let i = 0; i < 3; i++) {
      ids.push((await Product.create({ name: `Del ${ts}-${i}`, slug: `del-${ts}-${i}`, price: 5, stock: 0 })).id)
    }
    await Product.query().whereIn('id', ids).deleteAll()
    for (const id of ids) {
      const fresh = await Product.find(id)
      assert.strictEqual(fresh, null)
    }
  })
})

describe('ORM Introspection', () => {
  test('toSQL returns sql string', async () => {
    const q = Product.query().where('price', '>', 10).orderBy('id', 'desc').limit(5)
    const { sql, bindings } = q.toSQL()
    assert.ok(typeof sql === 'string')
    assert.ok(sql.length > 0)
    assert.ok(Array.isArray(bindings))
  })
})

describe('ORM Nested Eager Loading', () => {
  const suiteTs = Date.now()

  test('nested eager loading batched: category -> products', async () => {
    const cat = await Category.create({ name: `Nest ${suiteTs}`, slug: `nest-${suiteTs}` })
    for (let i = 0; i < 3; i++) {
      await Product.create({ name: `NestP ${suiteTs}-${i}`, slug: `nestp-${suiteTs}-${i}`, price: 5, category: cat.id })
    }
    const products = await Product.with({ category: ['products'] }).where('category', cat.id).get()
    assert.ok(products.length >= 3)
    for (const p of products) {
      assert.ok(p.category)
      assert.ok(Array.isArray(p.category.products))
      assert.ok(p.category.products.length >= 3)
    }
  })

  test('eager-loading constraint filters relation', async () => {
    const cat = await Category.create({ name: `Cons ${suiteTs}`, slug: `cons-${suiteTs}` })
    await Product.create({ name: `Cons cheap ${suiteTs}`, slug: `cons-c-${suiteTs}`, price: 1, category: cat.id })
    await Product.create({ name: `Cons expensive ${suiteTs}`, slug: `cons-e-${suiteTs}`, price: 100, category: cat.id })

    const categories = await Category.with({ products: qb => qb.where('price', '>', 10) }).where('id', cat.id).get()
    assert.strictEqual(categories.length, 1)
    assert.strictEqual(categories[0].products.length, 1)
    assert.strictEqual(categories[0].products[0].price, 100)
  })
})

describe('ORM Relation Aggregates', () => {
  const suiteTs = Date.now()

  test('withSum on hasMany relation', async () => {
    const cat = await Category.create({ name: `Sum ${suiteTs}`, slug: `sum-${suiteTs}` })
    await Product.create({ name: `Sum P1 ${suiteTs}`, slug: `sum-p1-${suiteTs}`, price: 5, category: cat.id })
    await Product.create({ name: `Sum P2 ${suiteTs}`, slug: `sum-p2-${suiteTs}`, price: 15, category: cat.id })

    const [loaded] = await Category.query().withSum('products', 'price').where('id', cat.id).get()
    assert.ok(loaded)
    assert.strictEqual(loaded.productsSumPrice, 20)
  })

  test('withAvg on hasMany relation', async () => {
    const cat = await Category.create({ name: `Avg ${suiteTs}`, slug: `avg-${suiteTs}` })
    await Product.create({ name: `Avg P1 ${suiteTs}`, slug: `avg-p1-${suiteTs}`, price: 10, category: cat.id })
    await Product.create({ name: `Avg P2 ${suiteTs}`, slug: `avg-p2-${suiteTs}`, price: 20, category: cat.id })

    const [loaded] = await Category.query().withAvg('products', 'price').where('id', cat.id).get()
    assert.strictEqual(loaded.productsAvgPrice, 15)
  })

  test('withMax on hasMany relation', async () => {
    const cat = await Category.create({ name: `Max ${suiteTs}`, slug: `max-${suiteTs}` })
    await Product.create({ name: `Max P1 ${suiteTs}`, slug: `max-p1-${suiteTs}`, price: 7, category: cat.id })
    await Product.create({ name: `Max P2 ${suiteTs}`, slug: `max-p2-${suiteTs}`, price: 22, category: cat.id })

    const [loaded] = await Category.query().withMax('products', 'price').where('id', cat.id).get()
    assert.strictEqual(loaded.productsMaxPrice, 22)
  })

  test('withExists returns boolean flag', async () => {
    const withProds = await Category.create({ name: `Has ${suiteTs}`, slug: `has-${suiteTs}` })
    const noProds = await Category.create({ name: `None ${suiteTs}`, slug: `none-${suiteTs}` })
    await Product.create({ name: `HasP ${suiteTs}`, slug: `hasp-${suiteTs}`, price: 1, category: withProds.id })

    const results = await Category.query()
      .withExists('products')
      .whereIn('id', [withProds.id, noProds.id])
      .get()
    const byId = new Map(results.map(r => [r.id, r]))
    assert.strictEqual(byId.get(withProds.id).productsExists, true)
    assert.strictEqual(byId.get(noProds.id).productsExists, false)
  })
})

describe('ORM Cursor Pagination', () => {
  const suiteTs = Date.now()
  let ids = []

  before(async () => {
    for (let i = 0; i < 8; i++) {
      const p = await Product.create({ name: `Cur ${suiteTs}-${i}`, slug: `cur-${suiteTs}-${i}`, price: 1 })
      ids.push(p.id)
    }
  })

  test('cursorPaginate returns first page and nextCursor', async () => {
    const page = await Product.query().whereIn('id', ids).cursorPaginate({ perPage: 3 })
    assert.strictEqual(page.data.length, 3)
    assert.strictEqual(page.meta.hasMore, true)
    assert.ok(page.meta.nextCursor)
  })

  test('cursorPaginate follows nextCursor', async () => {
    const page1 = await Product.query().whereIn('id', ids).cursorPaginate({ perPage: 3 })
    const page2 = await Product.query().whereIn('id', ids).cursorPaginate({ perPage: 3, cursor: page1.meta.nextCursor })
    assert.strictEqual(page2.data.length, 3)
    assert.notStrictEqual(page2.data[0].id, page1.data[0].id)
  })
})

describe('ORM Bug Fixes', () => {
  test('clone preserves limit/offset/select/page/perPage', async () => {
    const base = Product.query().where('price', '>', 1).limit(5).offset(2).paginate(2, 3)
    const cloned = base.clone()
    assert.strictEqual(cloned._limit, base._limit)
    assert.strictEqual(cloned._offset, base._offset)
    assert.strictEqual(cloned._page, base._page)
    assert.strictEqual(cloned._perPage, base._perPage)
  })

  test('belongsToMany lazy load works', async () => {
    const ts = Date.now()
    const tag = await Tag.create({ name: `LazyTag ${ts}`, slug: `lazy-tag-${ts}` })
    const product = await Product.create({ name: `LazyP ${ts}`, slug: `lazyp-${ts}`, price: 5 })
    product.tags = [tag.id]
    await product.save()

    const loaded = await Product.find(product.id)
    await loaded.load('tags')
    assert.ok(Array.isArray(loaded.tags))
    assert.strictEqual(loaded.tags.length, 1)
    assert.strictEqual(loaded.tags[0].id, tag.id)
  })

  test('getQueryBuilder returns underlying MikroORM QB', async () => {
    const qb = Product.query().where('price', '>', 0).getQueryBuilder()
    assert.ok(qb)
    assert.strictEqual(typeof qb.execute, 'function')
  })

  test('pagination meta shape is stable', async () => {
    const result = await Product.query().paginate(1, 5).get()
    assert.ok(result.data)
    assert.ok(result.meta)
    assert.ok(typeof result.meta.currentPage === 'number')
    assert.ok(typeof result.meta.lastPage === 'number')
    assert.ok(typeof result.meta.perPage === 'number')
    assert.ok(typeof result.meta.total === 'number')
    assert.ok(typeof result.meta.from === 'number')
    assert.ok(typeof result.meta.to === 'number')
  })
})

describe('ORM belongsToMany diff sync', () => {
  test('sync only touches added and removed pivot rows', async () => {
    const ts = Date.now()
    const tag1 = await Tag.create({ name: `Diff1 ${ts}`, slug: `diff1-${ts}` })
    const tag2 = await Tag.create({ name: `Diff2 ${ts}`, slug: `diff2-${ts}` })
    const tag3 = await Tag.create({ name: `Diff3 ${ts}`, slug: `diff3-${ts}` })

    const product = await Product.create({ name: `DiffP ${ts}`, slug: `diffp-${ts}`, price: 1 })
    product.tags = [tag1.id, tag2.id]
    await product.save()

    let loaded = await Product.find(product.id)
    await loaded.load('tags')
    assert.strictEqual(loaded.tags.length, 2)

    loaded.tags = [tag2.id, tag3.id]
    await loaded.save()

    const reloaded = await Product.find(product.id)
    await reloaded.load('tags')
    const tagIds = reloaded.tags.map(t => t.id).sort()
    assert.deepStrictEqual(tagIds, [tag2.id, tag3.id].sort())
  })
})
