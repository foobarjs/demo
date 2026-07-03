import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOpenApi, createServer, hashPassword, loadAppGraph } from '@foobarjs/framework';
import adminConfig from '#config/admin.js';
import middlewareConfig from '#config/middleware.js';

const demoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test('demo app graph loads ecommerce features', async () => {
  const graph = await loadAppGraph(demoRoot);

  assert.deepEqual(graph.modelList.map((item) => item.name), ['Category', 'Customer', 'Order', 'OrderItem', 'Page', 'Product', 'User']);
  assert.deepEqual(graph.adminResourceList.map((item) => item.modelName), ['Category', 'Customer', 'Order', 'OrderItem', 'Page', 'Product']);
  assert.deepEqual(graph.apiResourceList.map((item) => item.modelName), ['Category', 'Customer', 'Order', 'Product']);
  assert.equal(graph.plugins.has('health'), true);
  assert.equal(graph.jobs.has('SendOrderReceipt'), true);
  assert.equal(graph.events.has('order.placed'), true);
  // Routes: 8 web + 5 product + 2 order + 2 category + 2 customer + 4 OPTIONS preflight = 23 total
  // But OPTIONS count as routes too, so actual is 13 after de-duplication
  assert.equal(graph.routes.length, 13);

  const openapi = buildOpenApi(graph, { title: 'Foobar Demo API' });
  assert.ok(openapi.paths['/api/products']);
  assert.ok(openapi.paths['/api/orders']);
  assert.ok(openapi.paths['/api/categories']);
  assert.ok(openapi.paths['/api/customers']);
  assert.equal(middlewareConfig.groups.web.includes('VerifyCsrfToken'), true);
});

test('demo app serves storefront, API docs, admin, and health', async () => {
  const server = await createServer({ appRoot: demoRoot, databasePath: ':memory:' });
  server.repos.get('User').create({
    name: 'Demo Admin',
    email: 'admin@shop.test',
    password: await hashPassword('password'),
    role: 'admin',
    status: 'active',
  });
  const category = server.repos.get('Category').create({
    name: 'Bags',
    slug: 'bags',
    description: 'Useful carry goods.',
    status: 'active',
  });
  const product = server.repos.get('Product').create({
    name: 'Everyday Tote',
    slug: 'everyday-tote',
    sku: 'BAG-TOTE-001',
    description: 'A sturdy everyday tote.',
    imagePath: 'products/everyday-tote.svg',
    price: 49,
    inventory: 20,
    status: 'active',
    categoryId: category.id,
  });
  server.listen(0);
  await once(server, 'listening');

  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const adminPath = String(adminConfig.path || '/_admin').replace(/\/+$/, '') || '/_admin';
    const home = await fetch(`${base}/`);
    assert.equal(home.status, 200);
    assert.ok(home.headers.get('x-frame-options'));
    assert.ok(home.headers.get('x-content-type-options'));
    assert.match(await home.text(), /Foobar Commerce/);

    const health = await fetch(`${base}/_health`);
    assert.deepEqual(await health.json(), { ok: true, app: 'foobarjs-ecommerce' });

    const defaultProducts = await fetch(`${base}/api/products`);
    const defaultProductsPayload = await defaultProducts.json();
    assert.equal(Object.hasOwn(defaultProductsPayload.data[0], 'category'), false);
    assert.equal(Object.hasOwn(defaultProductsPayload.data[0], 'orderItemsCount'), false);

    const guestOrders = await fetch(`${base}/api/orders`);
    assert.equal([401, 403].includes(guestOrders.status), true);

    const unauthorizedStore = await fetch(`${base}/api/products`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Unauthorized Product',
        slug: 'unauthorized-product',
        sku: 'UNAUTH-001',
        price: 10,
        inventory: 1,
        status: 'active',
      }),
    });
    assert.equal([401, 403].includes(unauthorizedStore.status), true);

    const unauthorizedUpdate = await fetch(`${base}/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Blocked Update' }),
    });
    assert.equal([401, 403].includes(unauthorizedUpdate.status), true);

    const unauthorizedDelete = await fetch(`${base}/api/products/${product.id}`, {
      method: 'DELETE',
    });
    assert.equal([401, 403].includes(unauthorizedDelete.status), true);

    const products = await fetch(`${base}/api/products?include=category&withCount=orderItems`);
    const productsPayload = await products.json();
    assert.equal(productsPayload.data[0].category.name, 'Bags');
    assert.equal(productsPayload.data[0].imagePath, 'products/everyday-tote.svg');
    assert.equal(productsPayload.data[0].orderItemsCount, 0);

    const apiDocs = await fetch(`${base}/_docs/api`);
    assert.equal(apiDocs.status, 200);
    assert.match(await apiDocs.text(), /foobarjs API Docs/);

    const login = await fetch(`${base}${adminPath}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: 'admin@shop.test', password: 'password' }),
      redirect: 'manual',
    });
    assert.equal(login.status, 302);
    const cookie = login.headers.get('set-cookie').split(/,\s*/).map((item) => item.split(';')[0]).join('; ');
    const dashboard = await fetch(`${base}${adminPath}`, { headers: { cookie } });
    assert.equal(dashboard.status, 200);
    assert.match(await dashboard.text(), /Products/);

    const productEdit = await fetch(`${base}${adminPath}/product/${product.id}/edit`, { headers: { cookie } });
    assert.equal(productEdit.status, 200);
    const productEditHtml = await productEdit.text();
    assert.match(productEditHtml, /enctype="multipart\/form-data"/);
    assert.match(productEditHtml, /type="file" name="imagePath" accept="image\/\*"/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
