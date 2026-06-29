# AGENTS.md

Repository-level instructions for AI coding agents working on the **foobarjs demo** app.

## Project

This repository is the runnable ecommerce demo for
[`foobarjs/foobarjs`](https://github.com/foobarjs/foobarjs).

It should showcase realistic business-app usage of the framework:

- model-first ecommerce domain code
- explicit `adminResource()` configuration
- explicit `apiResource()` configuration
- schema, migrations, and seeders
- server-rendered storefront pages
- generated REST API and API docs
- userland tests that verify the app from the outside

## Local Framework Link

During the GitHub beta this app depends on the framework repo root:

```json
{
  "foobarjs": "git+ssh://git@github.com/foobarjs/foobarjs.git#main"
}
```

That package installs the workspace packages used by app imports and the
`foobar` binary. Published demo releases may switch to scoped npm versions.

Keep `package.json` scripts minimal. Use scripts for common app lifecycle
shortcuts such as `dev`, `serve`, `seed`, `doctor`, and `test`; use direct
`foobar ...` or `npx foobar ...` commands for schema, migration, API docs, and
inspection tasks.

## Boundaries

This repo should contain app/userland code only.

Framework implementation, framework docs, and framework unit/feature/integration
tests belong in the sibling `framework/` repository. Demo tests belong in this
repo's `tests/` directory.

## Commands

Use npm and Node's built-in tooling:

```bash
npm install
cp .env.example .env
npm test
npx foobar schema:push
npm run seed -- --fresh --count 25
npm run dev
```

## AI-Facing Notes

When changing demo structure, app conventions, or showcased framework features,
update this file and `README.md` so Copilot and future agents can recover the
current direction quickly.
