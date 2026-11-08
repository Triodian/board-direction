// Importing the client's provider register into the B1 inventory (development plan task R.1): the same 50-row CSV as
// AI Use Assessment's, with two malformed rows. The engagement is served from a stub; every save is captured.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { U } from '../helpers.js';

const FX = new URL('../../fixtures/provider-register.csv', import.meta.url).pathname;
const C = JSON.parse(readFileSync(new URL('../../../public/bd-content.json', import.meta.url), 'utf8'));

test('the provider register loads into B1, refuses bad rows, matches areas by name, and round-trips the ids', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.recorder }, viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); sessionStorage.setItem('triodian.example.left', '1'); } catch (e) {} });
  const data = { schema: 'triodian.bd.v1', engagement: { id: 'eimp', company: 'Coastline Super (fictional)', entityType: 'superannuationTrustee', jurisdiction: 'AU', sector: 'AU-SUPERANNUATION', mode: 'connected', sectorPack: 'superTrustee', reference: '', privilegeMarking: '', practitioner: { firm: '', line: '' }, boardDates: { workshop: '', resolution: '' }, gcActsAsCounsel: false, secondApproverId: '' },
    areas: C.sectorPacks.find(p => p.id === 'superTrustee').areas.map((name, i) => ({ id: 'A' + (i + 1), name })), scopeAgreed: {}, inventory: [], positions: {}, questions: [], resolution: {}, people: [], versions: [], previous: null, history: [] };
  let rev = 1, last = null;
  await ctx.route('**/api/engagement', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { exists: true, revision: rev, data, people: [] } });
    last = route.request().postDataJSON().data; rev += 1; return route.fulfill({ json: { revision: rev } });
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/'); await p.locator('#step-B1 > summary').click();
  await p.click('[data-act="importInventory"]').catch(() => {}); // opens the file chooser; the file is set directly below
  await p.setInputFiles('#inventoryIn', FX);
  await expect(p.locator('#toast')).toContainText('50 inventory lines imported; 2 rows refused');
  await expect(p.locator('#step-B1')).toContainText('Line 28: no provider');
  await expect.poll(() => last && (last.inventory || []).length).toBe(50);
  const l1 = last.inventory[0];
  expect(l1).toMatchObject({ providerId: 'PR-0101', externalId: 'AIS-001', use: 'Claims triage model 1', authority: 'A1', area: 'A1' });
  expect(last.inventory[1].area).toBe('A2'); // Claims and group insurance, matched by name
  expect(l1.source).toContain('row 3 (PR-0101 · AIS-001)');
  // back out in the import format with the client's ids
  const out = await p.evaluate(() => window.BDImport.readArrangements(window.BDApp.inventoryCsv()));
  expect(out.rows.map(r => [r.providerId, r.systemId])).toEqual(last.inventory.map(l => [l.providerId, l.externalId]));
  expect(errs).toEqual([]);
  await ctx.close();
});
