# foobarjs demo — event platform

> **Experimental — for exploration only.** Tracks foobarjs v0.3.1. APIs and conventions may still shift between releases.

A small event-ticketing platform built with [foobarjs](https://github.com/foobarjs/foobarjs). It's the reference application — every subsystem the framework ships is exercised somewhere in here, so it doubles as a "how do I…" cookbook you can grep.

Attendees receive tickets via magic-link auth. Organizers get a dashboard with revenue and attendee aggregates. Admins get the auto-generated admin panel and JSON API for free.

## 👋 New to foobarjs?

Read the [**30-minute tutorial**](https://foobarjs.github.io/docs/tutorial) first — it walks you from `foobar new` to a working feature and is easier to follow than this demo. Come back here when you want to see a fuller app.

## Requirements

- Node 20+

## Quick start

```bash
git clone git@github.com:foobarjs/demo.git
cd demo
npm install
cp .env.example .env
npx foobar key:generate    # copy the value into .env as APP_SECRET
npx foobar db:sync --force
npx foobar db:seed
npx foobar serve --dev
```

Open <http://localhost:3000>.

## Demo credentials

**Insecure — local exploration only.** Change or delete `database/seeders/` before deploying anything based on this.

- Organizer login: `admin@foobar.com` / `aaaaaaaa` (admin panel + `/organizer/dashboard`)
- Attendee portal: enter any seeded attendee email at `/tickets` — a magic-link email is written to `storage/logs/mail.log`

## Running the tests

```bash
npm test
```

242 integration tests using `foobarjs/test`. If a fresh clone fails, run `npx foobar db:sync --force` once (better-sqlite3 rebuilds on first ABI mismatch — see the tests' setup notes).

## What's in the box

**Models** (`app/models/`) — Event, TicketType, Order, Attendee, DiscountCode, AuditLog (a `CustomModel` example), User (extends `AuthenticableModel`).

**Controllers** (`app/controllers/`):
- `home`, `events`, `checkout`, `tickets` — public + attendee portal
- `organizer/dashboard`, `organizer/events` — organizer area guarded by `['auth', 'RequireUser']`
- `boom` — deliberately throws for the error-page playground

**Admin resources** (`app/admin/`) — one per model, fluent builder style (`Admin.resource(Model).label(...).form(...).columns(...)`).

**Gates** (`app/gates/`) — event / order / attendee authorization with scope filtering (auto-applied to admin + API).

**API** (`app/api/`) — public `/api/events` (read-only), protected `/api/orders` (`.middleware('auth')`).

**Rest** — validators (`checkout`, `update-ticket-name`, `send-magic-link`), a magic-link listener, an `OrderPlaced` event, JSX views under `app/views/`, and one config file per subsystem in `config/`.

## Interesting spots to read

- `app/controllers/tickets.controller.js` — magic-link auth via `Url.signedRoute` + `Url.hasValidSignature`.
- `app/controllers/organizer/dashboard.controller.js` — one-shot dashboard using `User.query().with('events', …).withSum('events.orders', 'total', q => q.where('status', 'confirmed')).withCount('events.attendees')` (dotted-path through aggregates, no JOINs).
- `app/models/order.model.js` — `.min(0)` on money fields plus a DB `CHECK` constraint (defense in depth).
- `routes/web.js` — only custom paths; convention routing backfills every REST verb (v0.3.0 explicit-wins).

## Docs

Full framework docs at <https://foobarjs.github.io/docs>.

## License

MIT — see [`LICENSE`](./LICENSE).
