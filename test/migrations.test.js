import { test, describe, assert } from 'foobarjs/test'
import { Migrator, Db, Model, Field } from 'foobarjs/orm'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// End-to-end coverage for the file-migration workflow.
// Uses a temp basePath with an isolated SQLite file so it doesn't touch
// the shared demo/db/foobar.db.
//
// MikroORM refuses to boot with zero entities, so we register a token model.

class _MigrationTestToken extends Model {
  static tableName = '_migration_test_token'
  static schema = { label: Field.string() }
  static timestamps = false
}

async function bootFresh() {
  const dir = mkdtempSync(join(tmpdir(), 'foobar-mig-e2e-'))
  mkdirSync(join(dir, 'database', 'migrations'), { recursive: true })
  mkdirSync(join(dir, 'db'), { recursive: true })
  const config = { get: (k) => k === 'database.database' ? 'test.db' : k === 'database.directory' ? join(dir, 'db') : undefined }

  // Reset the singleton so each test gets its own ORM.
  await Db.close()
  await Db.boot(config, [_MigrationTestToken], dir, { skipSync: true })
  return dir
}

async function teardown(dir) {
  await Db.close()
  rmSync(dir, { recursive: true, force: true })
}

describe('Migration workflow (file-based)', () => {
  test('full round trip: make -> migrate -> status -> rollback', async () => {
    const dir = await bootFresh()
    try {
      const migrator = new Migrator(Db.orm, dir)

      let rows = await migrator.status()
      assert.strictEqual(rows.length, 0)

      writeFileSync(
        join(dir, 'database', 'migrations', '2025_01_01_000001_create_widgets.js'),
        `export default {
          async up(schema) {
            await schema.createTable('widgets', (t) => {
              t.id()
              t.string('name').notNullable()
              t.integer('price').default(0)
              t.timestamps()
            })
          },
          async down(schema) {
            await schema.dropTable('widgets')
          },
        }`
      )
      writeFileSync(
        join(dir, 'database', 'migrations', '2025_01_01_000002_add_sku.js'),
        `export default {
          async up(schema) {
            await schema.alterTable('widgets', (t) => {
              t.string('sku').nullable()
            })
          },
          async down(schema) {
            await schema.alterTable('widgets', (t) => {
              t.dropColumn('sku')
            })
          },
        }`
      )

      rows = await migrator.status()
      assert.strictEqual(rows.length, 2)
      assert.strictEqual(rows.every((r) => r.ran === false), true)

      const applied = await migrator.run()
      assert.strictEqual(applied.ran.length, 2)
      assert.strictEqual(applied.batch, 1)

      const conn = Db.orm.em.getConnection()
      const info = await conn.execute(`PRAGMA table_info('widgets')`)
      const cols = info.map((r) => r.name)
      assert.ok(cols.includes('id'), `expected id column, got ${cols.join(', ')}`)
      assert.ok(cols.includes('name'))
      assert.ok(cols.includes('price'))
      assert.ok(cols.includes('sku'))
      assert.ok(cols.includes('created_at'))

      rows = await migrator.status()
      assert.strictEqual(rows.every((r) => r.ran === true), true)

      const noop = await migrator.run()
      assert.strictEqual(noop.ran.length, 0)

      const rolled = await migrator.rollback({ step: 1 })
      assert.strictEqual(rolled.rolled.length, 2)

      const check = await conn.execute(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='widgets'`
      )
      assert.strictEqual(check.length, 0)

      rows = await migrator.status()
      assert.strictEqual(rows.every((r) => r.ran === false), true)
    } finally {
      await teardown(dir)
    }
  })

  test('makeBlank writes a well-formed empty migration', async () => {
    const dir = await bootFresh()
    try {
      const migrator = new Migrator(Db.orm, dir)
      const { filename, path } = migrator.makeBlank('backfill_countries')
      assert.match(filename, /^\d{4}_\d{2}_\d{2}_\d{6}_backfill_countries\.js$/)
      const content = readFileSync(path, 'utf8')
      assert.ok(content.includes('backfill_countries'))
      assert.ok(content.includes('async up(schema)'))
      assert.ok(content.includes('async down(schema)'))
    } finally {
      await teardown(dir)
    }
  })

  test('rollback step-by-step undoes one batch at a time', async () => {
    const dir = await bootFresh()
    try {
      const migrator = new Migrator(Db.orm, dir)

      writeFileSync(
        join(dir, 'database', 'migrations', '2025_01_01_000001_first.js'),
        `export default {
          async up(schema) { await schema.createTable('t1', (t) => t.id()) },
          async down(schema) { await schema.dropTable('t1') },
        }`
      )
      await migrator.run()

      writeFileSync(
        join(dir, 'database', 'migrations', '2025_01_01_000002_second.js'),
        `export default {
          async up(schema) { await schema.createTable('t2', (t) => t.id()) },
          async down(schema) { await schema.dropTable('t2') },
        }`
      )
      await migrator.run()

      const r1 = await migrator.rollback({ step: 1 })
      assert.strictEqual(r1.rolled.length, 1)
      assert.strictEqual(r1.rolled[0], '2025_01_01_000002_second.js')

      const r2 = await migrator.rollback({ step: 1 })
      assert.strictEqual(r2.rolled.length, 1)
      assert.strictEqual(r2.rolled[0], '2025_01_01_000001_first.js')
    } finally {
      await teardown(dir)
    }
  })
})
