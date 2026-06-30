import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, hashPassword } from '@foobarjs/framework';

const demoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function mergeCookies(current, response) {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return current;
  const bag = new Map();

  for (const token of current.split(/;\s*/).filter(Boolean)) {
    const [name, ...valueParts] = token.split('=');
    bag.set(name, valueParts.join('='));
  }

  for (const part of setCookie.split(/,\s*/)) {
    const cookiePair = part.split(';')[0];
    const [name, ...valueParts] = cookiePair.split('=');
    bag.set(name, valueParts.join('='));
  }

  return Array.from(bag.entries()).map(([name, value]) => `${name}=${value}`).join('; ');
}

function extractCsrf(html) {
  return html.match(/name="_csrf"\s+value="([^"]+)"/)?.[1] || '';
}

test('app auth flow supports login, protected account, and logout', async () => {
  const server = await createServer({ appRoot: demoRoot, databasePath: ':memory:' });
  const users = server.repos.get('User');
  users.create({
    name: 'Auth Tester',
    email: 'auth@example.test',
    password: await hashPassword('secret-123'),
    role: 'admin',
    status: 'active',
  });

  server.listen(0);
  await once(server, 'listening');

  try {
    const base = `http://127.0.0.1:${server.address().port}`;

    const guestAccount = await fetch(`${base}/account`, { redirect: 'manual' });
    assert.equal(guestAccount.status, 302);
    assert.equal(guestAccount.headers.get('location'), '/login');

    let cookie = '';
    const loginPage = await fetch(`${base}/login`);
    assert.equal(loginPage.status, 200);
    cookie = mergeCookies(cookie, loginPage);
    const loginPageHtml = await loginPage.text();
    const firstCsrf = extractCsrf(loginPageHtml);
    assert.ok(firstCsrf);

    const failedLogin = await fetch(`${base}/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie,
      },
      body: new URLSearchParams({
        _csrf: firstCsrf,
        email: 'auth@example.test',
        password: 'wrong-password',
      }),
      redirect: 'manual',
    });
    assert.equal(failedLogin.status, 302);
    assert.equal(failedLogin.headers.get('location'), '/login');
    cookie = mergeCookies(cookie, failedLogin);

    const loginRetry = await fetch(`${base}/login`, { headers: { cookie } });
    assert.equal(loginRetry.status, 200);
    cookie = mergeCookies(cookie, loginRetry);
    const retryHtml = await loginRetry.text();
    assert.match(retryHtml, /These credentials do not match our records\./);
    const secondCsrf = extractCsrf(retryHtml);
    assert.ok(secondCsrf);

    const successfulLogin = await fetch(`${base}/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie,
      },
      body: new URLSearchParams({
        _csrf: secondCsrf,
        email: 'auth@example.test',
        password: 'secret-123',
      }),
      redirect: 'manual',
    });
    assert.equal(successfulLogin.status, 302);
    assert.equal(successfulLogin.headers.get('location'), '/account');
    cookie = mergeCookies(cookie, successfulLogin);

    const account = await fetch(`${base}/account`, { headers: { cookie } });
    assert.equal(account.status, 200);
    const accountHtml = await account.text();
    assert.match(accountHtml, /auth@example\.test/);
    const logoutCsrf = extractCsrf(accountHtml);
    assert.ok(logoutCsrf);

    const logout = await fetch(`${base}/logout`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie,
      },
      body: new URLSearchParams({ _csrf: logoutCsrf }),
      redirect: 'manual',
    });
    assert.equal(logout.status, 302);
    assert.equal(logout.headers.get('location'), '/login');
    cookie = mergeCookies(cookie, logout);

    const accountAfterLogout = await fetch(`${base}/account`, {
      headers: { cookie },
      redirect: 'manual',
    });
    assert.equal(accountAfterLogout.status, 302);
    assert.equal(accountAfterLogout.headers.get('location'), '/login');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('role-based API authorization denies non-admin writes and allows admin backoffice reads', async () => {
  const server = await createServer({ appRoot: demoRoot, databasePath: ':memory:' });
  const users = server.repos.get('User');
  const categories = server.repos.get('Category');
  const products = server.repos.get('Product');
  const customers = server.repos.get('Customer');
  const orders = server.repos.get('Order');

  const category = categories.create({
    name: 'Authz',
    slug: 'authz',
    status: 'active',
  });
  const product = products.create({
    name: 'Role Tested Product',
    slug: 'role-tested-product',
    sku: 'ROLE-001',
    description: 'Used for role authorization checks.',
    imagePath: 'products/role-tested.svg',
    price: 50,
    inventory: 5,
    status: 'active',
    categoryId: category.id,
  });
  const customer = customers.create({
    firstName: 'Role',
    lastName: 'Customer',
    email: 'customer@example.test',
    status: 'active',
  });
  orders.create({
    number: 'ORD-ROLE-1',
    email: customer.email,
    status: 'pending',
    subtotal: 50,
    tax: 4,
    shipping: 0,
    total: 54,
    customerId: customer.id,
  });

  users.create({
    name: 'Viewer User',
    email: 'viewer@example.test',
    password: await hashPassword('viewer-secret'),
    role: 'viewer',
    status: 'active',
  });
  users.create({
    name: 'Admin User',
    email: 'admin@example.test',
    password: await hashPassword('admin-secret'),
    role: 'admin',
    status: 'active',
  });

  server.listen(0);
  await once(server, 'listening');

  async function login(email, password) {
    const base = `http://127.0.0.1:${server.address().port}`;
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
    cookie = mergeCookies(cookie, result);
    return { base, cookie, response: result };
  }

  try {
    const viewer = await login('viewer@example.test', 'viewer-secret');
    assert.equal(viewer.response.status, 302);

    const viewerWriteDenied = await fetch(`${viewer.base}/api/products/${product.id}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: viewer.cookie,
      },
      body: JSON.stringify({ name: 'Should Not Update' }),
    });
    assert.equal(viewerWriteDenied.status, 403);

    const viewerOrdersDenied = await fetch(`${viewer.base}/api/orders`, {
      headers: { cookie: viewer.cookie },
    });
    assert.equal(viewerOrdersDenied.status, 403);

    const admin = await login('admin@example.test', 'admin-secret');
    assert.equal(admin.response.status, 302);

    const adminOrdersAllowed = await fetch(`${admin.base}/api/orders`, {
      headers: { cookie: admin.cookie },
    });
    assert.equal(adminOrdersAllowed.status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
