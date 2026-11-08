// The board directions feed (development plan task 3.4). Through the real Worker, the feed answers 404 with the reason
// until the chair records directions in connected mode; in the browser, the chair records them at B9. The server rules
// are in tests/directions.test.mjs.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { api, U } from '../helpers.js';

const C = JSON.parse(readFileSync(new URL('../../../public/bd-content.json', import.meta.url), 'utf8'));

test('GET /api/board-directions answers 404 with the reason until the chair records the directions', async () => {
  const r = await api('GET', '/api/board-directions');
  expect(r.status).toBe(404);
  expect(r.body.error).toMatch(/no board engagement yet|standalone|not recorded the board directions/);
});


test('in connected mode the chair records the board directions at B9', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.chair }, viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); sessionStorage.setItem('triodian.example.left', '1'); } catch (e) {} });
  const me = (await api('GET', '/api/me', undefined, U.chair)).body.user;
  const data = { schema: 'triodian.bd.v1', engagement: { id: 'edir', company: 'Acme Bank', entityType: 'authorisedDepositTakingInstitution', jurisdiction: 'AU', sector: 'AU-BANKING', mode: 'connected', sectorPack: 'adi', reference: '', privilegeMarking: '', practitioner: { firm: '', line: '' }, boardDates: { workshop: '', resolution: '' }, gcActsAsCounsel: false, secondApproverId: '' },
    areas: C.sectorPacks.find(p => p.id === 'adi').areas.map((name, i) => ({ id: 'A' + (i + 1), name })), scopeAgreed: {}, inventory: [], positions: { B2: { A1: { posture: 'S2' } } }, questions: [], resolution: {}, people: [], versions: [], previous: null, history: [] };
  let rev = 1, last = null;
  await ctx.route('**/api/engagement', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { exists: true, revision: rev, data, people: [] } });
    last = route.request().postDataJSON().data; rev += 1;
    return route.fulfill({ json: { revision: rev } });
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/'); await p.locator('#step-B9 > summary').click();
  await expect(p.locator('#step-B9')).toContainText('Board directions · read by the AI risk appetite engagement');
  await p.click('[data-act="recordDirections"]');
  await p.click('[data-act="recordDirections"]');
  await expect(p.locator('#toast')).toContainText('The board directions are recorded');
  await expect.poll(() => last && last.directions && last.directions.by).toBe(me.id);
  expect(errs).toEqual([]);
  await ctx.close();
});

// The board view (task 3.6): the chair takes it from AI Risk Appetite for a meeting, and B9 shows it.
test('the chair takes the board view for a meeting, and B9 shows the approved positions and the measures', async ({ browser }) => {
  const V = JSON.parse(readFileSync(new URL('../fixtures/board-view.json', import.meta.url), 'utf8'));
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.chair }, viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); sessionStorage.setItem('triodian.example.left', '1'); } catch (e) {} });
  const data = { schema: 'triodian.bd.v1', engagement: { id: 'ebv', company: 'Acme Bank', entityType: 'authorisedDepositTakingInstitution', jurisdiction: 'AU', sector: 'AU-BANKING', mode: 'connected', sectorPack: 'adi', reference: '', privilegeMarking: '', practitioner: { firm: '', line: '' }, boardDates: { workshop: '', resolution: '2026-12-02' }, gcActsAsCounsel: false, secondApproverId: '' },
    areas: [{ id: 'A1', name: 'Retail lending and credit decisions' }], scopeAgreed: {}, inventory: [], positions: {}, questions: [], resolution: {}, people: [], versions: [], previous: null, history: [] };
  let rev = 1, last = null;
  await ctx.route('**/api/engagement', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { exists: true, revision: rev, data, people: [] } });
    last = route.request().postDataJSON().data; rev += 1;
    return route.fulfill({ json: { revision: rev } });
  });
  await ctx.route('**/api/board-view-from-appetite', route => route.fulfill({ json: V }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/'); await p.locator('#step-B9 > summary').click();
  await expect(p.locator('#step-B9')).toContainText('No board view taken yet.');
  await p.click('[data-act="takeBoardView"]');
  await expect(p.locator('#step-B9')).toContainText('Board meeting 2 December 2026');
  await expect(p.locator('#step-B9')).toContainText('the AI risk appetite is working, agreed by the CRO, version 3');
  await expect(p.locator('#step-B9')).toContainText('A2 · A person reviews every decline');
  await expect(p.locator('#step-B9')).toContainText('version 3 is working, not yet approved');
  await expect(p.locator('#step-B9')).toContainText('Gaps by priority: High 1 · Medium 2 · Low 0');
  await expect(p.locator('#step-B9')).toContainText('Not counted · The trigger log is kept outside the register');
  await expect.poll(() => last && (last.boardViews || []).length).toBe(1);
  expect(last.boardViews[0].meeting).toBe('2026-12-02');
  expect(errs).toEqual([]);
  await ctx.close();
});

test('the link to AI Risk Appetite answers with the reason when it is not reached', async () => {
  const r = await api('GET', '/api/board-view-from-appetite');
  expect([502, 503]).toContain(r.status);
  expect(r.body.error).toMatch(/Risk Appetite app/);
});
