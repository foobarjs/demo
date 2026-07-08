import { test, describe, assert, before, boot } from 'foobarjs/test'
import Hooked, { calls } from '../app/models/hooked.model.js'

before(async () => {
  await boot()
})

describe('Model Hooks', () => {
  test('fires create hooks in correct order', async () => {
    calls.length = 0
    const model = await Hooked.create({ name: 'Hook Test', value: 'test' })
    assert.ok(model.id)
    assert.deepStrictEqual(calls, [
      'beforeValidate', 'afterValidate',
      'beforeSave', 'beforeCreate', 'afterCreate', 'afterSave',
    ], 'create hooks order')
  })

  test('fires update hooks in correct order', async () => {
    const model = await Hooked.create({ name: 'Hook Update', value: 'initial' })
    calls.length = 0
    model.value = 'updated'
    await model.save()
    assert.deepStrictEqual(calls, [
      'beforeValidate', 'afterValidate',
      'beforeSave', 'beforeUpdate', 'afterUpdate', 'afterSave',
    ], 'update hooks order')
  })

  test('fires delete hooks in correct order', async () => {
    const model = await Hooked.create({ name: 'Hook Delete', value: 'delete-me' })
    calls.length = 0
    await model.delete()
    assert.deepStrictEqual(calls, ['beforeDelete', 'afterDelete'], 'delete hooks order')
  })

  test('fires afterFetch on find', async () => {
    const model = await Hooked.create({ name: 'Hook Fetch', value: 'fetch-test' })
    calls.length = 0
    const found = await Hooked.find(model.id)
    assert.ok(found)
    assert.ok(calls.includes('afterFetch'), 'afterFetch should fire on find()')
  })

  test('fires afterFetch on all()', async () => {
    calls.length = 0
    const all = await Hooked.all()
    assert.ok(all.length > 0)
    assert.ok(calls.includes('afterFetch'), 'afterFetch should fire on all()')
  })
})
