# foobarjs demo

Reference application for [foobarjs](https://github.com/foobarjs/foobarjs).

Exercises every subsystem: ORM (models, relations, aggregates, hooks,
transactions), auth (session + personal access tokens), admin panel,
auto-generated API, queues, cache, notifications, mail, realtime, events,
validation, and more.

## Requirements

- Node 20+

## Quick start

```bash
git clone git@github.com:foobarjs/demo.git
cd demo
npm install
cp .env.example .env
npx foobar key:generate    # copy the value into .env as APP_SECRET
npx foobar db fresh
npx foobar db seed
npx foobar serve
```

Then open http://localhost:3000.

## Demo admin credentials

**Insecure — for local exploration only.**

- Email: `admin@foobar.com`
- Password: `aaaaaaaa`

Change or remove `demo/seed.js` before deploying anything based on this app.

## Running the tests

```bash
npm test
```

## What's in the box

- `app/models/` — User, Category, Product, Profile, Tag, Order, OrderItem, and a demo Hooked model
- `app/controllers/` — Home, Checkout, Boom (error playground)
- `app/admin/` — Admin panel resources for Product and Order using both plain-object and fluent-builder styles
- `app/validators/` — FormRequest example (Checkout)
- `app/jobs/` — Queued job example (send-welcome-email)
- `app/listeners/` — Event listener example (send-order-confirmation)
- `app/notifications/` — Multi-channel notification example (order-shipped)
- `config/` — one file per subsystem
- `test/` — integration tests using `foobarjs/test`

## License

MIT — see [`LICENSE`](./LICENSE).
