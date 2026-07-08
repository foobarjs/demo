import { test, describe, assert, before, after, boot } from 'foobarjs/test'
import { Foobar } from 'foobarjs/core'
import { Realtime, WebSocket } from 'foobarjs/realtime'

let server = null
let port = null
let realtime = null

before(async () => {
  const foobar = new Foobar()
  await foobar.boot()
  port = 19000 + Math.floor(Math.random() * 1000)
  server = await foobar.start(port)
  realtime = Realtime.getInstance({ redisBroadcast: false })
})

after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve))
  }
})

function waitForMessage(ws, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('websocket message timeout')), timeout)
    ws.once('message', (data) => {
      clearTimeout(timer)
      resolve(JSON.parse(data.toString()))
    })
  })
}

describe('Realtime', () => {
  test('connects and receives connected event', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`)
    const messagePromise = waitForMessage(ws)
    await new Promise((resolve, reject) => {
      ws.once('open', resolve)
      ws.once('error', reject)
    })

    const message = await messagePromise
    assert.strictEqual(message.event, 'connected')
    assert.ok(message.payload.id)

    ws.close()
  })

  test('subscribes to channel and receives broadcast', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`)
    const connectedPromise = waitForMessage(ws)
    await new Promise((resolve, reject) => {
      ws.once('open', resolve)
      ws.once('error', reject)
    })

    await connectedPromise

    ws.send(JSON.stringify({ event: 'subscribe', payload: { channel: 'orders' } }))
    const subscribed = await waitForMessage(ws)
    assert.strictEqual(subscribed.event, 'subscribed')

    realtime.channel('orders').emit('order.created', { id: 1 })

    const message = await waitForMessage(ws)
    assert.strictEqual(message.event, 'order.created')
    assert.deepStrictEqual(message.payload, { id: 1 })

    ws.close()
  })
})
