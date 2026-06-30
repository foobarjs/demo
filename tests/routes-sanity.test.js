import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppGraph } from '@foobarjs/framework';

const demoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test('named route helpers resolve core web flows', async () => {
  const graph = await loadAppGraph(demoRoot);

  assert.equal(graph.router.url('home'), '/');
  assert.equal(graph.router.url('auth.login.show'), '/login');
  assert.equal(graph.router.url('auth.account'), '/account');
  assert.equal(graph.router.url('checkout.show', { product: 42 }), '/checkout?product=42');
  assert.equal(graph.router.url('checkout.thanks', { id: 123 }), '/checkout/thanks?id=123');
});
