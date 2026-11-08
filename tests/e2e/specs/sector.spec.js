// Sector packs in set-up (development plan task 1.4). The engagement is served from a stub, so the test starts from a
// fresh set-up whatever the shared test engagement holds; every save the page makes is captured.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { U } from '../helpers.js';

const C = JSON.parse(readFileSync(new URL('../../../public/bd-content.json', import.meta.url), 'utf8'));
const fresh = () => ({
  schema: 'triodian.bd.v1',
  engagement: { id: 'esector', company: 'Test Mutual', entityType: '', jurisdiction: 'AU', mode: 'standalone', reference: '', privilegeMarking: '', practitioner: { firm: '', line: '' }, boardDates: { workshop: '', resolution: '' }, gcActsAsCounsel: false, secondApproverId: '', sectorPack: 'general' },
  areas: C.startingAreas.map((name, i) => ({ id: 'A' + (i + 1), name })), scopeAgreed: {},
  inventory: [], positions: {}, questions: [], resolution: {}, people: [], versions: [], previous: null, history: [],
});

test('choosing the entity type and mode brings in the sector pack, its areas and its B3 uses', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.mo }, viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); sessionStorage.setItem('triodian.example.left', '1'); } catch (e) {} });
  let rev = 1, last = null;
  await ctx.route('**/api/engagement', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { exists: true, revision: rev, data: fresh(), people: [] } });
    last = route.request().postDataJSON().data; rev += 1;
    return route.fulfill({ json: { revision: rev } });
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/');
  const pack = p.locator('#f_engagement_sectorPack'), area0 = p.locator('[data-area="0"]');
  await expect(pack.locator('option')).toHaveCount(1); // standalone: the general pack only
  await expect(area0).toHaveValue(C.startingAreas[0]);

  await p.locator('#f_engagement_mode').selectOption('connected');
  await p.locator('#f_engagement_entityType').selectOption('generalInsurer');
  await expect(pack).toHaveValue('generalInsurer');
  await expect(area0).toHaveValue('Underwriting and pricing');
  await expect(p.locator('#toast')).toContainText('General insurer list');

  // once the areas are the company's own, a new pack leaves them alone until asked
  await area0.fill('Underwriting'); await area0.blur();
  await pack.selectOption('adi');
  await expect(area0).toHaveValue('Underwriting');
  await expect(p.locator('body')).toContainText('Suggested for General insurer: General insurer');
  await p.click('[data-act="usePackAreas"]');
  await expect(area0).toHaveValue('Retail lending and credit decisions');

  // B0 names the pack; B3 offers the sector's uses first
  await p.locator('#step-B0 > summary').click();
  await expect(p.locator('#step-B0')).toContainText('Authorised deposit-taking institution');
  await p.locator('#step-B3 > summary').click();
  await p.click('[data-act="toggleCand"]');
  await expect(p.locator('#step-B3')).toContainText('AI making a final credit decline with no person reviewing it');

  await expect.poll(() => last && last.engagement.sectorPack).toBe('adi');
  await expect.poll(() => last && last.areas[0].name).toBe('Retail lending and credit decisions');
  expect(errs).toEqual([]);
  await ctx.close();
});

test('jurisdiction, then regulated sector, then entity type; the sector suggests the mode and the pack', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.mo }, viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); sessionStorage.setItem('triodian.example.left', '1'); } catch (e) {} });
  let rev = 1, last = null;
  await ctx.route('**/api/engagement', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { exists: true, revision: rev, data: fresh(), people: [] } });
    last = route.request().postDataJSON().data; rev += 1;
    return route.fulfill({ json: { revision: rev } });
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/');
  const jur = p.locator('#f_engagement_jurisdiction'), sec = p.locator('#f_engagement_sector'), ent = p.locator('#f_engagement_entityType');
  await expect(sec.locator('option', { hasText: 'Superannuation' })).toHaveCount(1);

  await sec.selectOption('AU-INSURANCE');
  await expect(ent.locator('option')).toHaveCount(5); // Choose…, three insurers, Other
  await expect(p.locator('body')).toContainText('Insurance is financially regulated, so Connected mode usually fits');

  await jur.selectOption('SG');
  await expect(sec).toHaveValue('');
  await sec.selectOption('SG-BANKING');
  await expect(ent).toHaveValue('bank');
  await p.locator('#f_engagement_mode').selectOption('connected');
  await expect(p.locator('#f_engagement_sectorPack')).toHaveValue('masFi');
  await expect(p.locator('body')).not.toContainText('Connected mode usually fits');

  await expect.poll(() => last && [last.engagement.jurisdiction, last.engagement.sector, last.engagement.entityType, last.engagement.sectorPack].join()).toBe('SG,SG-BANKING,bank,masFi');
  expect(errs).toEqual([]);
  await ctx.close();
});

test('a superannuation trustee in connected mode gets the super pack, with the Risk Appetite functions as areas', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.mo }, viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); sessionStorage.setItem('triodian.example.left', '1'); } catch (e) {} });
  let rev = 1, last = null;
  await ctx.route('**/api/engagement', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { exists: true, revision: rev, data: fresh(), people: [] } });
    last = route.request().postDataJSON().data; rev += 1;
    return route.fulfill({ json: { revision: rev } });
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/');
  await p.locator('#f_engagement_sector').selectOption('AU-SUPERANNUATION');
  await expect(p.locator('#f_engagement_entityType')).toHaveValue('superannuationTrustee');
  await p.locator('#f_engagement_mode').selectOption('connected');
  await expect(p.locator('#f_engagement_sectorPack')).toHaveValue('superTrustee');
  await expect(p.locator('[data-area="0"]')).toHaveValue('Member services and communications');
  await p.locator('#step-B0 > summary').click();
  await expect(p.locator('#step-B0')).toContainText('Sector packSuperannuation trustee');
  await expect.poll(() => last && last.areas.map(a => a.name).join('|')).toBe(C.sectorPacks.find(x => x.id === 'superTrustee').areas.join('|'));
  expect(errs).toEqual([]);
  await ctx.close();
});

test('the worked example names its pack at B0', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.director } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/'); await expect(p.locator('.examplebar')).toContainText('Worked example');
  await p.locator('#step-B0 > summary').click();
  await expect(p.locator('#step-B0')).toContainText('General (any organisation)');
  expect(errs).toEqual([]);
  await ctx.close();
});
