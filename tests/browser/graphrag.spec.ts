import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { FalkorDB } from 'falkordb';

test.beforeEach(async () => {
  // Reset only this disposable test namespace's SDK budget between independent cases/runs.
  const db = await FalkorDB.connect({ url: process.env.FALKORDB_TEST_URL || 'falkor://127.0.0.1:6379' });
  try {
    const connection = await db.connection;
    const hash = createHash('sha256').update('rag-global').digest('hex');
    const keys = await connection.keys(`opsrelay:opsrelay_e2e:limit:${hash}:*`);
    if (keys.length) await connection.del(keys);
  } finally { await db.close(); }
});

test('document search is authenticated, isolated and rejects unreviewed notices', async ({ page, browser }) => {
  expect((await page.request.post('/api/brain', { data: { kind: 'search_knowledge', question: 'Kestrel' } })).status()).toBe(401);
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Explore live demo', exact: true }).click();
  await page.getByRole('link', { name: 'Company knowledge', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Search the company’s evidence', exact: true })).toBeVisible();
  const empty = await page.request.post('/api/brain', { data: { kind: 'search_knowledge', question: 'Kestrel' } });
  expect(empty.status()).toBe(200); expect((await empty.json()).items).toEqual([]);
  expect((await page.request.post('/api/brain', { data: { kind: 'index_document', id: '../../opsrelay' } })).status()).toBe(400);
  await page.request.post('/api/brain', { data: { kind: 'import_notice', title: 'Reviewed indexing gate', body: 'Kestrel Components confirms M14 arrival on 2026-10-25.' } });
  const doc = (await (await page.request.get('/api/brain')).json()).documents[0];
  expect((await page.request.post('/api/brain', { data: { kind: 'index_document', id: doc.id } })).status()).toBe(409);
  expect((await page.request.post('/api/brain', { data: { kind: 'search_knowledge', question: 'Kestrel' } })).status()).toBe(429);
  const second = await browser.newContext();
  try {
    await second.request.post('http://127.0.0.1:3101/api/session', { data: { kind: 'demo' } });
    expect((await (await second.request.get('http://127.0.0.1:3101/api/brain')).json()).graphRag.indexed).toEqual([]);
  } finally { await second.close(); }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('evidence search renders verified passages, announces results and opens the original source', async ({ page }) => {
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Explore live demo', exact: true }).click();
  await expect(page.getByText('Your private demo', { exact: true })).toBeVisible();
  const original = 'Kestrel Components confirms M14 arrival on 2026-10-25 after a transport disruption.';
  await page.request.post('/api/brain', { data: { kind: 'import_notice', title: 'Evidence search interaction fixture', body: original } });
  const doc = (await (await page.request.get('/api/brain')).json()).documents[0];
  await page.request.post('/api/brain', { data: { kind: 'review_notice', id: doc.id, decision: 'apply', arrivalDate: '2026-10-25' } });
  // UI fixture only; actual Gemini+SDK integration is exercised by test:graphrag:cloud.
  await page.route('**/api/brain', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      const response = await route.fetch(); const body = await response.json();
      await route.fulfill({ response, json: { ...body, graphRag: { configured: true, sdk: '1.4.0', indexed: [{ id: doc.id, indexedAt: '2026-10-19T00:00:00Z' }] } } });
    } else if (request.postDataJSON()?.kind === 'search_knowledge') {
      await route.fulfill({ json: { sdk: '1.4.0', items: [{ sourceId: doc.sourceId, chunkId: 'ui-fixture-chunk', text: original, title: doc.title, entities: ['Kestrel Components', 'M14'], historical: false }] } });
    } else await route.continue();
  });
  await page.reload();
  await page.getByRole('link', { name: 'Company knowledge', exact: true }).click();
  await page.getByRole('button', { name: 'Search evidence', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '1 verified passage found.' })).toBeVisible();
  await expect(page.locator('.knowledge-match blockquote')).toHaveText(original);
  await page.getByRole('button', { name: 'Read original source', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(original);
});
