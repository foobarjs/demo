import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, hashPassword } from '@foobarjs/framework';

const demoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function extractCsrf(html) {
  const match = html.match(/name="_csrf"\s+value="([^"]+)"/);
  return match?.[1];
}

function mergeCookies(existing, response) {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return existing;
  return `${existing}; ${setCookie}`.replace(/^; /, '');
}

test('checkout handles invalid product and inventory depletion', async () => {
  const server = await createServer({ appRoot: demoRoot, databasePath: ':memory:' });
  const categories = server.repos.get('Category');
  const products = server.repos.get('Product');

  const category = categories.create({
    name: 'Test',
    slug: 'test',
    status: 'active',
  });
  const product = products.create({
    name: 'Limited Stock',
    slug: 'limited-stock',
    sku: 'LIMITED-001',
    description: 'Very limited inventory.',
    imagePath: 'products/limited.svg',
    price: 99.99,
    inventory: 1,
    status: 'active',
    categoryId: category.id,
  });

  server.listen(0);
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // Test: Attempt checkout with invalid product ID
    let checkoutPage = await fetch(`${base}/checkout?product=99999`);
    assert.equal(checkoutPage.status, 404);

    // Test: Checkout form shows inventory and max quantity
    checkoutPage = await fetch(`${base}/checkout?product=${product.id}`);
    const checkoutHtml = await checkoutPage.text();
    assert.match(checkoutHtml, /1 in stock/);
    assert.match(checkoutHtml, /max="1"/);

    // Test: Successful checkout with valid quantity
    let cookie = '';
    checkoutPage = await fetch(`${base}/checkout?product=${product.id}`);
    cookie = mergeCookies(cookie, checkoutPage);
    const csrf = extractCsrf(await checkoutPage.text());

    const success = await fetch(`${base}/checkout`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie,
      },
      body: new URLSearchParams({
        _csrf: csrf,
        productId: product.id,
        email: 'customer@example.com',
        quantity: 1,
      }),
      redirect: 'manual',
    });
    assert.equal(success.status, 302);
    const thankYouUrl = success.headers.get('location');
    assert.match(thankYouUrl, /^\/checkout\/thanks\?id=\d+$/);

    // Test: Inventory was decremented
    const updatedProduct = products.find(product.id);
    assert.equal(updatedProduct.inventory, 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('category and customer APIs enforce correct access levels', async () => {
  const server = await createServer({ appRoot: demoRoot, databasePath: ':memory:' });
  const categories = server.repos.get('Category');
  const customers = server.repos.get('Customer');
  const users = server.repos.get('User');

  categories.create({
    name: 'Books',
    slug: 'books',
    status: 'active',
  });
  customers.create({
    firstName: 'Jane',
    lastName: 'Customer',
    email: 'jane@example.com',
    status: 'active',
  });
  users.create({
    name: 'Admin',
    email: 'admin@example.com',
    password: await hashPassword('admin-pass'),
    role: 'admin',
    status: 'active',
  });
  users.create({
    name: 'Viewer',
    email: 'viewer@example.com',
    password: await hashPassword('viewer-pass'),
    role: 'viewer',
    status: 'active',
  });

  server.listen(0);
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;

  async function login(email, password) {
    let cookie = '';
    const loginPage = await fetch(`${base}/login`);
    cookie = mergeCookies(cookie, loginPage);
    const csrf = extractCsrf(await loginPage.text());
    const result = await fetch(`${base}/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie,
      },
      body: new URLSearchParams({ _csrf: csrf, email, password }),
      redirect: 'manual',
    });
    return mergeCookies(cookie, result);
  }

  try {
    // Test: Categories API is public (no auth required)
    const categoriesPublic = await fetch(`${base}/api/categories`);
    assert.equal(categoriesPublic.status, 200);
    const categoriesData = await categoriesPublic.json();
    assert.equal(categoriesData.data.length, 1);

    // Test: Customers API requires authentication (returns 403 for policy denial)
    const customersGuest = await fetch(`${base}/api/customers`);
    assert.equal(customersGuest.status, 403);

    // Test: Viewer role cannot access customers API
    const viewerCookie = await login('viewer@example.com', 'viewer-pass');
    const customersViewer = await fetch(`${base}/api/customers`, {
      headers: { cookie: viewerCookie },
    });
    assert.equal(customersViewer.status, 403);

    // Test: Admin can access customers API
    const adminCookie = await login('admin@example.com', 'admin-pass');
    const customersAdmin = await fetch(`${base}/api/customers`, {
      headers: { cookie: adminCookie },
    });
    assert.equal(customersAdmin.status, 200);
    const customersResult = await customersAdmin.json();
    assert.equal(customersResult.data.length, 1);
    assert.equal(customersResult.data[0].firstName, 'Jane');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
