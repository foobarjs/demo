import { test, describe, assert } from 'foobarjs/test'
import { Mailer } from 'foobarjs/mail'

describe('Mail', () => {
  test('sends email via array driver', async () => {
    Mailer.configure({ driver: 'array' })

    const result = await Mailer
      .to('user@example.com')
      .subject('Test')
      .html('<h1>Hello</h1>')
      .send()

    assert.ok(result.sentAt)
    assert.ok(result.to.includes('user@example.com'))
  })

  test('stores sent messages for inspection', async () => {
    Mailer.configure({ driver: 'array' })

    await Mailer
      .to('alice@test.com')
      .subject('Welcome')
      .html('<p>Welcome!</p>')
      .send()

    await Mailer
      .to('bob@test.com')
      .subject('Reminder')
      .html('<p>Reminder!</p>')
      .send()

    const all = Mailer.getArrayDriverMessages()
    assert.ok(all.length >= 2)
    assert.ok(all.some(m => m.subject === 'Welcome'))
    assert.ok(all.some(m => m.subject === 'Reminder'))
  })

  test('supports multiple recipients', async () => {
    Mailer.configure({ driver: 'array' })

    await Mailer
      .to(['a@test.com', 'b@test.com'])
      .subject('Broadcast')
      .text('Hello all')
      .send()

    const msgs = Mailer.getArrayDriverMessages()
    const broadcast = msgs.find(m => m.subject === 'Broadcast')
    assert.ok(broadcast)
    assert.ok(broadcast.to.includes('a@test.com'))
    assert.ok(broadcast.to.includes('b@test.com'))
  })

  test('sends email via log driver', async () => {
    Mailer.configure({ driver: 'log', log: { path: '/tmp/foobar-test-mail.log' } })

    const result = await Mailer
      .to('log@test.com')
      .subject('Log Test')
      .text('This is a log test')
      .send()

    assert.ok(result.sentAt)

    const { readFileSync, existsSync } = await import('node:fs')
    assert.ok(existsSync('/tmp/foobar-test-mail.log'))
    const log = readFileSync('/tmp/foobar-test-mail.log', 'utf-8')
    assert.ok(log.includes('log@test.com'))
    assert.ok(log.includes('Log Test'))
  })
})
