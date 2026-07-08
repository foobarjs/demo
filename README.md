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
- `app/controllers/` — Home, Products, Cart, Checkout, Boom (error playground). All extend the framework's `Controller` base class.
- `app/admin/` — Admin panel resources for Product and Order using the fluent-builder style (`Admin.resource(Model).label(...)...`)
- `app/validators/` — FormRequest example (Checkout)
- `app/jobs/` — Queued job example (send-welcome-email)
- `app/listeners/` — Event listener example (send-order-confirmation)
- `app/notifications/` — Multi-channel notification example (order-shipped)
- `app/serializers/` — Serializer example (Product)
- `app/events/` — Event example (OrderPlaced)
- `config/` — one file per subsystem (app, database, session, admin, mail, cache, queue, redis, realtime, notifications, storage, cors, security, events)
- `routes/` — `web.js` demonstrates the explicit routing style alongside the filename convention
- `test/` — 39 integration test suites (253 tests) using `foobarjs/test`

## Docs

See <https://foobarjs.github.io/docs> for full framework documentation.

## License

MIT — see [`LICENSE`](./LICENSE).
