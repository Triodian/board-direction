// B9: the chair records the resolution; the engagement locks; Triodian starts the next review (task 1.5, step B9).
import { test, expect } from '@playwright/test';
import { pageAs, U, api, editAs } from '../helpers.js';

async function ensureEngagement(browser) {
  if ((await api('GET', '/api/engagement', undefined, U.mo)).body.exists) return;
  const mo = await pageAs(browser, U.mo);
  await mo.click('[data-act="new"]');
  await expect(mo.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
  await mo.context().close();
}
const openB9 = async p => { await p.locator('#step-B9 > summary').click(); await expect(p.locator('#step-B9')).toHaveAttribute('open', ''); };
const saved = p => expect(p.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
const data = async () => (await api('GET', '/api/engagement', undefined, U.mo)).body.data;

test('the chair records the resolution; the engagement locks; Triodian starts the next review', async ({ browser }) => {
  await ensureEngagement(browser);
  // only the chair drafts or records it
  const rec = await pageAs(browser, U.recorder);
  await openB9(rec);
  await expect(rec.locator('#res_text')).toHaveCount(0);
  await rec.context().close();
  expect((await editAs(U.recorder, d => { d.resolution = { text: 'Drafted by Triodian' }; })).status).toBe(403);

  const ch = await pageAs(browser, U.chair);
  await openB9(ch);
  await expect(ch.locator('#step-B9')).toContainText('Before the board resolves');
  await ch.locator('#res_min').fill('Board minute 2026/12-04'); await ch.locator('#res_min').blur();
  await ch.locator('[data-ce="CE4"]').uncheck();
  await saved(ch);
  let r = (await data()).resolution;
  expect(r.minuteRef).toBe('Board minute 2026/12-04');
  expect(r.changeEvents).not.toContain('CE4');
  expect(r.by || '').toBe(''); // drafted, not recorded
  await ch.click('[data-act="recordResolution"]');
  await expect(ch.locator('[data-act="recordResolution"]')).toContainText('Confirm');
  await ch.click('[data-act="recordResolution"]');
  await saved(ch);
  const chairId = (await api('GET', '/api/me', undefined, U.chair)).body.user.id;
  r = (await data()).resolution;
  expect(r.by).toBe(chairId);
  expect(r.text).toContain('resolves');
  await expect(ch.locator('#step-B9')).toContainText('Recorded by');
  expect(ch._errors).toEqual([]);
  await ch.context().close();

  // locked: positions and the inventory can no longer change
  expect((await editAs(U.chair, d => { d.positions.B8 = { owners: { AC1: 'Changed after resolution' } }; })).status).toBe(403);
  expect((await editAs(U.ceo, d => { d.inventory.push({ id: 'L' + (700 + d.inventory.length), use: 'After resolution' }); })).status).toBe(403);

  // the method owner starts the next review; the resolved engagement is kept
  const mo = await pageAs(browser, U.mo);
  await openB9(mo);
  await mo.click('[data-act="nextReview"]');
  await mo.click('[data-act="nextReview"]');
  await expect(mo.locator('#toast')).toContainText('The next review has started');
  const n = await data();
  expect(n.resolution).toEqual({});
  expect(n.previous.label).toContain('resolved');
  expect((await api('GET', '/api/archive', undefined, U.mo)).body.entries.length).toBeGreaterThan(0);
  expect(mo._errors).toEqual([]);
  await mo.context().close();
});

test('the worked example shows the recorded resolution and its change events', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.chair } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/'); await expect(p.locator('.examplenote')).toContainText('Worked example');
  await openB9(p);
  await expect(p.locator('#step-B9')).toContainText('Board minute 2026/12-04');
  await expect(p.locator('#step-B9')).toContainText('A material AI incident');
  await expect(p.locator('#res_text')).toHaveCount(0);
  // versions: V1 at the scope agreement, V2 at the resolution; compare V1 with now
  await expect(p.locator('#step-B9')).toContainText('Resolved by the board (B9)');
  await p.click('[data-act="compareVersion"][data-id="V1"]');
  await expect(p.locator('#compare')).toContainText('B3 Red lines: recorded since.');
  await expect(p.locator('#compare')).toContainText('Resolved by the board since.');
  await p.click('[data-act="compareVersion"][data-id="V2"]');
  await expect(p.locator('#compare')).toContainText('Nothing has changed.');
  expect(errs).toEqual([]);
  await ctx.close();
});

test('the user guide covers the steps, the briefing, the checks, versions and notifications', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.director } });
  const p = await ctx.newPage();
  await p.goto('/user-guide/');
  for (const h of ['The ten steps', 'Set-up, the brief and the briefing (B0)', 'The checks', 'Resolving (B9) and versions', 'Email notifications and your profile']) await expect(p.locator('h2', { hasText: h })).toHaveCount(1);
  await expect(p.locator('body')).toContainText('Only you and the facilitators');
  await ctx.close();
});
