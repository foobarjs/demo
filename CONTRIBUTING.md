# Contributing to foobarjs

Thanks for your interest in improving foobarjs.

## Repository layout

foobarjs is split across three repositories:

- [`foobarjs/foobarjs`](https://github.com/foobarjs/foobarjs) — framework source
- [`foobarjs/demo`](https://github.com/foobarjs/demo) — reference application (integration test bed)
- [`foobarjs/docs`](https://github.com/foobarjs/docs) — documentation

Bug fixes and features land in `foobarjs/foobarjs`. New docs land in
`foobarjs/docs`. Fixes to demo-only code (models, controllers, seed) land in
`foobarjs/demo`.

## Prerequisites

- Node 20 or newer
- pnpm 9 or newer (or npm, but pnpm is what the maintainers use)

## Development loop

Clone the framework repo and the demo repo side by side:

```bash
git clone git@github.com:foobarjs/foobarjs.git
git clone git@github.com:foobarjs/demo.git

cd foobarjs && pnpm install && pnpm test          # framework unit tests
cd ../demo && pnpm install && npm test            # demo integration tests
```

To test framework changes against the demo, use `pnpm link`:

```bash
cd foobarjs
pnpm link --global

cd ../demo
pnpm link --global foobarjs
```

Undo with `pnpm unlink --global foobarjs`.

## Coding conventions

- ES modules only. `import` / `export`. No `require` outside `createRequire`.
- 2-space indent. Match neighbouring files for trailing semicolons.
- Named exports preferred. Default export only when convention demands it
  (`AuthPlugin`, models).
- No emojis in code or documentation unless the user asks for them.
- No comments unless they add real value.
- Follow existing patterns before inventing new ones. Grep first.

See [`AGENTS.md`](./AGENTS.md) for framework internals, common pitfalls,
and the full contributor guide.

## Tests

Every change that touches the framework must leave both suites green:

```bash
cd foobarjs && pnpm test    # framework unit tests
cd ../demo && npm test      # demo integration tests
```

## Branches and PRs

- Default branch: `develop`.
- Target `develop` for all pull requests.
- Keep commits focused. Squash on merge is fine.
- Write a concise commit message that matches the repo style.
- Update `CHANGELOG.md` for user-visible changes.

## Reporting bugs

Open an issue at
[`foobarjs/foobarjs/issues`](https://github.com/foobarjs/foobarjs/issues)
with:

- foobarjs version (`foobar --version`)
- Node version (`node --version`)
- OS
- Minimal reproduction steps

## Security

See [`SECURITY.md`](./SECURITY.md) for reporting vulnerabilities.

## Code of Conduct

By participating, you agree to abide by the
[Code of Conduct](./CODE_OF_CONDUCT.md).
