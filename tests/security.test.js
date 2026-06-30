import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '@foobarjs/framework';
import middlewareConfig from '../config/middleware.js';
import StoreProductRequest from '../app/Http/Requests/StoreProductRequest.js';
import UpdateProductRequest from '../app/Http/Requests/UpdateProductRequest.js';

const demoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function cookieHeaderFrom(response) {
  const header = response.headers.get('set-cookie');
  if (!header) return '';
  return header
    .split(/,\s*/)
    .map((item) => item.split(';')[0])
    .join('; ');
}

test('security baseline middleware is configured', () => {
  assert.equal(middlewareConfig.global.includes('SecureHeaders'), true);
  assert.equal(middlewareConfig.groups.web.includes('VerifyCsrfToken'), true);
  assert.equal(middlewareConfig.groups.api.includes('ApiThrottle'), true);
  assert.equal(middlewareConfig.groups.api.includes('ApiCors'), true);
  assert.equal(middlewareConfig.aliases.UploadBodyLimit.options.maxBytes <= 1024 * 1024, true);
  assert.ok(Array.isArray(middlewareConfig.aliases.ApiCors.options.origins));
  assert.equal(middlewareConfig.aliases.ApiCors.options.origins.length > 0, true);
  assert.equal(middlewareConfig.aliases.ApiCors.options.credentials, true);
  assert.equal(middlewareConfig.aliases.ApiCors.options.origins.includes('*'), false);
});

test('product image path validation blocks traversal-like paths', () => {
  const storePattern = StoreProductRequest.fields.imagePath.pattern;
  const updatePattern = UpdateProductRequest.fields.imagePath.pattern;

  assert.ok(storePattern instanceof RegExp);
  assert.ok(updatePattern instanceof RegExp);
  assert.equal(storePattern.test('products/tote.svg'), true);
  assert.equal(updatePattern.test('products/tote.svg'), true);
  assert.equal(storePattern.test('../etc/passwd'), false);
  assert.equal(updatePattern.test('../etc/passwd'), false);
  assert.equal(storePattern.test('/absolute/path.svg'), false);
  assert.equal(updatePattern.test('/absolute/path.svg'), false);
});

test('checkout rejects missing csrf token and accepts valid token', async () => {
  const server = await createServer({ appRoot: demoRoot, databasePath: ':memory:' });
  const category = server.repos.get('Category').create({
    name: 'Security',
    slug: 'security',
    status: 'active',
  });
  const product = server.repos.get('Product').create({
    name: 'Security Tote',
    slug: 'security-tote',
    sku: 'SEC-001',
    description: 'Secure checkout test product.',
    imagePath: 'products/security-tote.svg',
    price: 40,
    inventory: 10,
    status: 'active',
    categoryId: category.id,
  });

  server.listen(0);
  await once(server, 'listening');

  try {
    const base = `http://127.0.0.1:${server.address().port}`;

    const checkoutPage = await fetch(`${base}/checkout?product=${product.id}`);
    assert.equal(checkoutPage.status, 200);
    const html = await checkoutPage.text();
    const csrfMatch = html.match(/name="_csrf"\s+value="([^"]+)"/);
    assert.ok(csrfMatch);
    const csrfToken = csrfMatch[1];
    const cookie = cookieHeaderFrom(checkoutPage);

    const missingCsrf = await fetch(`${base}/checkout`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie,
      },
      body: new URLSearchParams({
        email: 'security@example.com',
        productId: String(product.id),
        quantity: '1',
      }),
      redirect: 'manual',
    });
    assert.equal([403, 419].includes(missingCsrf.status), true);

    const validCsrf = await fetch(`${base}/checkout`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie,
      },
      body: new URLSearchParams({
        _csrf: csrfToken,
        email: 'security@example.com',
        productId: String(product.id),
        quantity: '1',
      }),
      redirect: 'manual',
    });
    assert.equal(validCsrf.status, 302);
    assert.match(validCsrf.headers.get('location') || '', /^\/checkout\/thanks\?id=/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('api throttle eventually returns 429 under burst traffic', async () => {
  const server = await createServer({ appRoot: demoRoot, databasePath: ':memory:' });
  server.listen(0);
  await once(server, 'listening');

  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const statuses = [];
    for (let index = 0; index < 75; index += 1) {
      const response = await fetch(`${base}/api/products`);
      statuses.push(response.status);
    }

    assert.equal(statuses.some((status) => status === 429), true);
    assert.equal(statuses.every((status) => status === 200 || status === 429), true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('cors allows configured origin and blocks unknown origin headers', async () => {
  const server = await createServer({ appRoot: demoRoot, databasePath: ':memory:' });
  server.listen(0);
  await once(server, 'listening');

  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const allowedOrigin = middlewareConfig.aliases.ApiCors.options.origins[0];

    const allowed = await fetch(`${base}/api/orders`, {
      headers: { origin: allowedOrigin },
    });
    assert.equal([200, 401, 403].includes(allowed.status), true);
    assert.equal(allowed.headers.get('access-control-allow-origin'), allowedOrigin);
    assert.equal(allowed.headers.get('access-control-allow-credentials'), 'true');

    const disallowed = await fetch(`${base}/api/orders`, {
      headers: { origin: 'https://evil.example' },
    });
    assert.equal([200, 401, 403].includes(disallowed.status), true);
    assert.equal(disallowed.headers.get('access-control-allow-origin'), null);

    const preflight = await fetch(`${base}/api/orders`, {
      method: 'OPTIONS',
      headers: {
        origin: allowedOrigin,
        'access-control-request-method': 'POST',
      },
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), allowedOrigin);
    assert.equal(preflight.headers.get('access-control-allow-credentials'), 'true');
    assert.ok(preflight.headers.get('access-control-allow-methods'));

  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
