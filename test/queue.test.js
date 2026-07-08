import { test, describe, assert, before, beforeEach, boot } from 'foobarjs/test'
import { Job, Queue, QueueJob, FailedJob, work } from 'foobarjs/queue'
import { RedisManager } from 'foobarjs/redis'
import SendWelcomeEmail from '../app/jobs/send-welcome-email.job.js'

let redisAvailable = false

async function checkRedis() {
  return RedisManager.isAvailable(null, 1000)
}

before(async () => {
  await boot()
  redisAvailable = await checkRedis()
})

beforeEach(async () => {
  const jobs = await QueueJob.all()
  for (const job of jobs) {
    await job.delete()
  }
  const failed = await FailedJob.all()
  for (const job of failed) {
    await job.delete()
  }
})

describe('Queue', () => {
  test('redis driver stores job in queue', async () => {
    if (!redisAvailable) return assert.ok(true, 'redis unavailable')
    const job = await Queue.push(SendWelcomeEmail, [{ email: 'redis-queued@example.com' }], 'redis')
    assert.strictEqual(job.queue, 'default')
    assert.strictEqual(job.job, 'SendWelcomeEmail')
  })

  test('redis worker processes queued job', async () => {
    if (!redisAvailable) return assert.ok(true, 'redis unavailable')
    const email = `redis-worker-${Date.now()}@example.com`
    await Queue.push(SendWelcomeEmail, [{ email }], 'redis')

    let processed = false
    const originalHandle = SendWelcomeEmail.prototype.handle
    SendWelcomeEmail.prototype.handle = async function (user) {
      processed = true
      return originalHandle.call(this, user)
    }

    await work({
      connection: 'redis',
      once: true,
      jobs: { SendWelcomeEmail },
    })

    SendWelcomeEmail.prototype.handle = originalHandle

    assert.strictEqual(processed, true)
  })

  test('redis failed job is moved to failed list', async () => {
    if (!redisAvailable) return assert.ok(true, 'redis unavailable')
    class RedisFailingJob extends Job {
      async handle() {
        throw new Error('Redis intentional failure')
      }
    }

    await Queue.push(RedisFailingJob, [{}], 'redis')

    await work({
      connection: 'redis',
      once: true,
      jobs: { RedisFailingJob },
      tries: 1,
    })

    const failed = await Queue.failed('default', 'redis')
    assert.ok(failed.length >= 1)
    assert.strictEqual(failed[0].job, 'RedisFailingJob')
  })

  test('sync driver runs job immediately', async () => {
    const result = await Queue.push(SendWelcomeEmail, [{ email: 'sync@example.com' }], 'sync')
    assert.strictEqual(result.sent, true)
    assert.strictEqual(result.to, 'sync@example.com')
  })

  test('database driver stores job in queue', async () => {
    const job = await Queue.push(SendWelcomeEmail, [{ email: 'queued@example.com' }], 'database')
    assert.ok(job.id)
    assert.strictEqual(job.queue, 'default')
    assert.strictEqual(job.payload.job, 'SendWelcomeEmail')
  })

  test('worker processes queued job', async () => {
    const email = `worker-${Date.now()}@example.com`
    await Queue.push(SendWelcomeEmail, [{ email }], 'database')

    let processed = false
    const originalHandle = SendWelcomeEmail.prototype.handle
    SendWelcomeEmail.prototype.handle = async function (user) {
      processed = true
      return originalHandle.call(this, user)
    }

    await work({
      connection: 'database',
      once: true,
      jobs: { SendWelcomeEmail },
    })

    SendWelcomeEmail.prototype.handle = originalHandle

    assert.strictEqual(processed, true)
  })

  test('failed job is retried then removed', async () => {
    class FailingJob extends Job {
      async handle() {
        throw new Error('Intentional failure')
      }
    }

    await Queue.push(FailingJob, [{}], 'database')

    await work({
      connection: 'database',
      once: true,
      jobs: { FailingJob },
      tries: 1,
    })

    const remaining = await QueueJob.where('queue', 'default').get()
    assert.strictEqual(remaining.length, 0)
  })

  test('failed job is stored in failed_jobs table', async () => {
    class PersistentlyFailingJob extends Job {
      async handle() {
        throw new Error('Persistent failure')
      }
    }

    await Queue.push(PersistentlyFailingJob, [{}], 'database')

    await work({
      connection: 'database',
      once: true,
      jobs: { PersistentlyFailingJob },
      tries: 1,
    })

    const failed = await FailedJob.where('queue', 'default').first()
    assert.ok(failed)
    assert.strictEqual(failed.payload.job, 'PersistentlyFailingJob')
    assert.ok(failed.exception.includes('Persistent failure'))
  })

  test('failed job can be retried', async () => {
    class RetryableFailingJob extends Job {
      async handle() {
        throw new Error('Retryable failure')
      }
    }

    await Queue.push(RetryableFailingJob, [{}], 'database')

    await work({
      connection: 'database',
      once: true,
      jobs: { RetryableFailingJob },
      tries: 1,
    })

    const failed = await FailedJob.where('queue', 'default').first()
    assert.ok(failed)

    await failed.retry()

    const remainingFailed = await FailedJob.where('queue', 'default').get()
    assert.strictEqual(remainingFailed.length, 0)

    const queued = await QueueJob.where('queue', 'default').get()
    assert.strictEqual(queued.length, 1)
    assert.strictEqual(queued[0].payload.job, 'RetryableFailingJob')
  })
})
