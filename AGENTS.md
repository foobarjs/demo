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
- storage-backed product images and explicit admin upload fields
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

Products use `imagePath` as a storage key. `ProductAdmin` explicitly declares
it with `column('imagePath').image({ disk: 'public', directory: 'products' })`;
do not infer upload behavior from model strings.

The seeder writes small SVG product images to the public storage disk so demo
records point at real files.

`ProductApi` intentionally does not configure `resource`; it showcases the
framework's model-aware default API serializer. `/api/products` should still
honor `?include=category` and `?withCount=orderItems`. If a resource is added
later, `ProductResource` should not access `product.category` directly; use
`product.whenLoaded('category')`. In API JSON, omitted means not included;
`null` means the relationship was included and no related record exists.

When changing demo structure, app conventions, or showcased framework features,
update this file and `README.md` so Copilot and future agents can recover the
current direction quickly.
