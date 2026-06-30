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

The admin uses model-backed authentication through the seeded `User` model.
In production, set `APP_SECRET` and create real active admin users.
Use `APP_CORS_ORIGINS` to control allowed browser origins for API routes.
The seed also creates an application auth user: `admin@shop.test` with password
from `FOOBAR_ADMIN_PASSWORD`.

In the admin, Products include an explicit image upload field:

```js
column('imagePath').image({ disk: 'public', directory: 'products' })
```

Seeded products write lightweight SVG images to the public storage disk, so the
storefront, admin, and API all have realistic image data to work with.

## Security Posture (Beta)

The demo now ships with a security baseline that is covered by automated tests:

- CSRF protection is enforced for checkout form submissions.
- API write actions require authorization and are denied by default for guests.
- API rate limiting is enabled (`ApiThrottle`) and verified under burst load.
- API CORS is allowlist-based (`APP_CORS_ORIGINS`) and validated at runtime.
- Product image paths are validated to reject traversal-like input.
- Secure response headers are enabled through global `SecureHeaders` middleware.

Run the security regression suite:

```bash
node --test tests/security.test.js
```
