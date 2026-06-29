# foobarjs Demo

Realistic ecommerce demo app for foobarjs.

It showcases models, migrations, seeders, admin resources, API resources,
generated API docs, jobs, events, storage, and file uploads without a frontend
build step.

```bash
npm install
cp .env.example .env
npx foobar schema:push
npm run seed -- --fresh --count 25
npm run dev
```

Open:

```txt
http://localhost:3000/_admin
```

The development admin password is `password`.

In the admin, Products include an explicit image upload field:

```js
column('imagePath').image({ disk: 'public', directory: 'products' })
```

Seeded products write lightweight SVG images to the public storage disk, so the
storefront, admin, and API all have realistic image data to work with.
