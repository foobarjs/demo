import { test, describe, assert, before, boot } from 'foobarjs/test'
import { Notification, NotificationModel } from 'foobarjs/notifications'
import { Broadcast } from 'foobarjs/broadcast'
import { RedisManager } from 'foobarjs/redis'
import { Mailer } from 'foobarjs/mail'
import User from '../app/models/user.model.js'
import OrderShipped from '../app/notifications/order-shipped.notification.js'

let redisAvailable = false

async function checkRedis() {
  return RedisManager.isAvailable(null, 1000)
}

before(async () => {
  await boot()
  redisAvailable = await checkRedis()
  Mailer.configure({ driver: 'array' })
  Mailer.clearArrayDriver()
})

describe('Notifications', () => {
  test('stores database notification', async () => {
    const timestamp = Date.now()
    const user = await User.create({
      name: 'Notif User',
      email: `notif-${timestamp}@example.com`,
      password: 'secret123',
    })

    await Notification.send(user, new OrderShipped({ id: 123 }))

    const notifications = await NotificationModel.where('notifiable_id', user.id).get()
    assert.strictEqual(notifications.length, 1)
    assert.strictEqual(notifications[0].type, 'OrderShipped')
    assert.strictEqual(notifications[0].data.orderId, 123)
    assert.strictEqual(notifications[0].isRead(), false)
  })

  test('sends mail notification', async () => {
    Mailer.clearArrayDriver()
    const timestamp = Date.now()
    const user = await User.create({
      name: 'Mail User',
      email: `mail-${timestamp}@example.com`,
      password: 'secret123',
    })

    class MailOnly extends Notification {
      constructor() { super() }
      via() { return ['mail'] }
      toMail() {
        return { subject: 'Hello', text: 'Hello there' }
      }
    }

    await Notification.send(user, new MailOnly())

    const messages = Mailer.getArrayDriverMessages()
    assert.strictEqual(messages.length, 1)
    assert.ok(messages[0].subject.includes('Hello'))
  })

  test('marks notification as read', async () => {
    const timestamp = Date.now()
    const user = await User.create({
      name: 'Read User',
      email: `read-${timestamp}@example.com`,
      password: 'secret123',
    })

    await Notification.send(user, new OrderShipped({ id: 456 }))
    const [notification] = await NotificationModel.where('notifiable_id', user.id).get()
    notification.markAsRead()
    await notification.save()

    const updated = await NotificationModel.find(notification.id)
    assert.strictEqual(updated.isRead(), true)
  })

  test('broadcasts notification over redis', async () => {
    if (!redisAvailable) return assert.ok(true, 'redis unavailable')

    const timestamp = Date.now()
    const user = await User.create({
      name: 'Broadcast User',
      email: `broadcast-${timestamp}@example.com`,
      password: 'secret123',
    })

    let received = null
    const unsubscribe = await Broadcast.listen('notifications', (data) => {
      if (data.payload?.notifiableId === user.id) {
        received = data
      }
    })

    class BroadcastOnly extends Notification {
      constructor() { super() }
      via() { return ['broadcast'] }
      toBroadcast() { return { message: 'Broadcasted!' } }
    }

    await Notification.send(user, new BroadcastOnly())

    await new Promise(resolve => setTimeout(resolve, 300))
    await unsubscribe()

    assert.ok(received)
    assert.strictEqual(received.event, 'BroadcastOnly')
    assert.strictEqual(received.payload.message, 'Broadcasted!')
    assert.strictEqual(received.payload.notifiableId, user.id)
  })
})
