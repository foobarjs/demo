# AGENTS.md

Guidance for AI coding agents working on the **foobarjs demo** — the reference
application and integration test bed for [foobarjs](https://github.com/foobarjs/foobarjs).

## Repository role

This repo is one of three that make up foobarjs:

- [`foobarjs/foobarjs`](https://github.com/foobarjs/foobarjs) — framework source
- [`foobarjs/demo`](https://github.com/foobarjs/demo) — this repo, a reference app
- [`foobarjs/docs`](https://github.com/foobarjs/docs) — documentation

The demo depends on `foobarjs` as a Git dependency (`github:foobarjs/foobarjs#v0.1.0`).
It exercises every framework subsystem end-to-end. When a framework change lands,
the demo tests are the primary safety net.

## Package management

- ESM only (`"type": "module"`).
- Node 20+.
- No CommonJS. No build step. No transpiler.

## Running the demo and tests

```bash
cp .env.example .env
foobar key:generate           # paste value into .env as APP_SECRET
foobar db fresh && foobar db seed
foobar serve                  # http://localhost:3000
foobar test                   # runs 39 test suites, 253 tests
```

The demo runs the shared framework CLI (`foobar`) which is installed via
`npm install foobarjs`. Development against a local sibling framework checkout
uses `pnpm` workspace linking (see workspace root `AGENTS.md`).

## Where things live

- `app/models/` — Model classes extending `Model` from `foobarjs/orm` (or
  `AuthenticableModel` from `foobarjs/auth` for `User`).
- `app/controllers/` — Controllers extending `Controller` from `foobarjs/core`.
- `app/admin/` — Admin resource configurations using the fluent builder
  (`Admin.resource(Product).label(...)...`).
- `app/validators/` — `FormRequest` subclasses.
- `app/jobs/` — `Job` subclasses.
- `app/listeners/` — Listeners with `static events = [SomeEvent]`.
- `app/notifications/` — `Notification` subclasses.
- `app/events/` — Plain classes constructed and dispatched via `Event.dispatch`.
- `app/serializers/` — `Serializer` subclasses.
- `config/` — one file per subsystem (`app`, `database`, `session`, `admin`,
  `mail`, `cache`, `queue`, `redis`, `realtime`, `notifications`, `storage`,
  `cors`, `security`, `events`).
- `routes/web.js` — Explicit routes for anything the filename convention
  can't (or shouldn't) express.
- `test/` — Integration test suites.
- `db/foobar.db` — SQLite database (gitignored).
- `seed.js` — Database seeder (invoked by `foobar db seed`).

## Framework primitives cheat sheet

### Controllers

Extend `Controller` from `foobarjs/core`. The base class provides:

- `this.render(template, data)` — HTML response through the view engine.
- `this.json(data)` and `this.json(data, statusCode)` — JSON response.
- `this.text(body)` / `this.text(body, status)` — plain text.
- `this.redirect(path)` / `this.redirect(path, status)`.
- `this.body()` — request body (JSON or form).
- `this.params()` / `this.query()`.
- `this.getLoggedInUser()` / `this.isLoggedIn()`.
- `this.flash(key, message)` — chainable.
- `this.validate(FormRequestClass)` — returns the validated request.
- `this.c` — raw Hono context for escape hatches.

Return value conventions from a controller action:

- A `Response` — sent as-is.
- An object or array — auto-rendered through the matching view
  (`app/views/<controller>/<action>.html`) if it exists, else JSON.
- `undefined`/`null` — 204 No Content.

### Routes

Two mechanisms, both work in the same app:

1. **Filename convention** — `app/controllers/foo.controller.js` mounts
   at `/foo` with the seven REST routes for whichever methods you define
   (`index`, `new`, `store`, `show`, `edit`, `update`, `destroy`). Missing
   methods produce no route (404), not a 500. `home.controller.js` also
   mounts at `/`.

2. **Explicit registration** in `routes/web.js`:
   ```js
   export default function (router) {
     router.get('/', HomeController, 'index')
     router.get('/health', (c) => c.json({ status: 'ok' }))
     router.resource('/products', ProductsController)
   }
   ```
   Use this for routes that need custom paths, inline callbacks, or that
   simply benefit from being visible in one file.

### Models

```js
import { Model, Field } from 'foobarjs/orm'

class Product extends Model {
  static schema = {
    name: Field.string().required(),
    price: Field.decimal(10, 2).required(),
    stock: Field.number().default(0),
    category: Field.belongsTo('Category'),
  }
  static timestamps = true
  // static tableName = 'products'  // only when auto-pluralization is wrong
}
```

Full ORM API cheat sheet is in the framework's `AGENTS.md`.

### Admin

Uses the fluent builder exclusively in this demo:

```js
export default Admin.resource(Product)
  .label('Products')
  .columns([
    Column.text('name'),
    Column.money('price'),
    Column.belongsTo('category'),
  ])
  .filters([Filter.belongsTo('category'), Filter.boolean('published')])
```

### Serializers

`app/serializers/product.serializer.js` is auto-loaded by
`foobarjs/api` and `foobarjs/serialization`:

```js
import { Serializer } from 'foobarjs/serialization'

class ProductSerializer extends Serializer {
  static fields = ['id', 'name', 'slug', 'price']
}
export default ProductSerializer
```

## Common pitfalls

- **Shared SQLite DB.** All tests share `db/foobar.db`. Never rely on
  absolute row IDs. Create fixtures per test with unique timestamps:
  `const email = 'user-' + Date.now() + '@x.com'`.
- **Plaintext password assignment only.** `User.create({ password: 'plain' })`
  is correct; `AuthenticableModel` hashes automatically. Never pre-hash.
- **`APP_SECRET` is required** whenever `foobarjs/auth` is loaded (it is,
  via `config/app.js`'s `plugins` list). Tests read it from `.env`.
- **`markDirty(key)`** — custom setters on Model subclasses must call
  `this.markDirty(key)`, otherwise `save()` won't sync the change.
- **Custom setters** should not re-run when loading from DB — but this
  is handled automatically because `_fromEntity()` bypasses setters.
- **Constraint violations become `ValidationError`.** Do not catch MikroORM
  constraint exceptions directly. Catch `ValidationError` from `foobarjs/orm`.
- **Admin templates: render objects through `safe()`.** Dashboard widgets,
  flash payloads, etc. Otherwise `[object Object]`.

## When adding to the demo

1. If a new framework feature is being demonstrated, add a small realistic
   example (a model, a controller, a page, a test).
2. Add or extend an integration test in `test/`.
3. If the feature has a corresponding doc page, verify the docs reflect
   the new example.
4. Run `foobar test` and confirm all 253+ tests still pass.

## Security-sensitive demo code

Demo controllers that touch session/auth (login, magic-link verify,
authorize) or that merge request input into models must ship an
assertion in the same commit that would catch the class of bug the
change could introduce. Two examples already in the tree that follow
this pattern: `test/form-request.test.js` (validates the redirect vs.
422 contract) and `test/events.test.js` (asserts the checkout flow's
end state, including that the DB row lands with lowered/trimmed
fields).

Full rule and the list of framework files that trigger the check
is in [`framework/AGENTS.md`](../framework/AGENTS.md) under
"Security-sensitive code: co-shipped tests are mandatory". Applies here
because the demo consumes those framework surfaces directly.

## Never do

- Never commit or push automatically. Wait for explicit user instruction.
- Never introduce network calls in tests.
- Never bypass `AuthenticableModel` when creating users.
- Never treat `Model` instances as plain objects during serialization —
  call `toJSON()` (which respects `hidden` fields and `appends`).
- Never rely on the ordering of `Object.keys()` for correctness.
- Never use `@foobarjs/*` scoped imports (obsolete — everything is
  `foobarjs/<subsystem>` since 0.1.0).
