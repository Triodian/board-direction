// The files AI Board Direction writes and reads conform to the published exchange schemas (Triodian_Metamodel
// exchange/, vendored in vendor/exchange by tools/sync-exchange.mjs; development plan task R.4).
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ADMIN } from '../helpers.js';
import { exchangeErrors, fixture } from '../exchange.js';
import { directionsFrom } from '../../../lib/core/directions.js';
import { snapshotOf } from '../../../public/shared/versions.js';

const C = JSON.parse(readFileSync(new URL('../../../public/bd-content.json', import.meta.url), 'utf8'));

test('writes: the board directions and the confidentiality position, from the worked example', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': ADMIN } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); } catch (e) {} });
  const p = await ctx.newPage(); await p.goto('/');
  await expect(p.locator('.examplebar', { hasText: 'Worked example' })).toBeVisible({ timeout: 15_000 });
  const { S, conf } = await p.evaluate(() => { const S = JSON.parse(JSON.stringify(window.BDExample())); return { S, conf: window.BDOutputs.make(S, window.BD_CONTENT, { today: '2026-12-02' }).confidentiality() }; });
  expect(exchangeErrors('confidentiality-position-v1.schema.json', conf)).toEqual([]);
  // the worked example as a connected engagement whose chair recorded the directions
  S.engagement.mode = 'connected'; S.directions = { by: S.resolution.by, on: '2026-11-20' };
  const version = { id: 'V2', label: 'Board directions recorded', at: '2026-11-20T09:00:00.000Z', by: 'Chair', snapshot: snapshotOf(S) };
  expect(exchangeErrors('board-directions-v1.schema.json', directionsFrom(version, C, S))).toEqual([]);
  await ctx.close();
});

test('reads: the board view and the matter brief it is tested with conform', () => {
  expect(exchangeErrors('board-view-v1.schema.json', fixture('board-view.json'))).toEqual([]);
  expect(exchangeErrors('matter-brief-v1.schema.json', JSON.parse(readFileSync(new URL('../../fixtures/matter-brief-au.json', import.meta.url), 'utf8')))).toEqual([]);
});
