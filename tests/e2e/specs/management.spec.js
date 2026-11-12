// Phase 7: the technology owner and the AI governance team (development plan tasks 7.1 to 7.3).
// The team enters inventory lines and drafts measures, the technology owner confirms each, and the management
// briefing is recorded before the director briefing goes out. Neither role proposes or records a position.
import { test, expect } from '@playwright/test';
import { pageAs, U, api, editAs } from '../helpers.js';

async function ensureEngagement(browser) {
  if ((await api('GET', '/api/engagement', undefined, U.mo)).body.exists) return;
  const mo = await pageAs(browser, U.mo);
  await mo.click('[data-act="new"]');
  await expect(mo.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
  await mo.context().close();
}
const open = async (p, id) => { const d = p.locator(`#step-${id}`); if ((await d.getAttribute('open')) == null) await p.locator(`#step-${id} > summary`).click(); await expect(d).toHaveAttribute('open', ''); };
const saved = p => expect(p.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
const engagement = async () => (await api('GET', '/api/engagement', undefined, U.mo)).body.data;

test('Admin refuses a second technology owner, and allows several in the AI governance team', async () => {
  const r = await api('POST', '/api/admin/users', { email: 'cio2@bd.test', name: 'Second CIO', organisation: 'Test', roles: ['technologyOwner'], isAdmin: false, active: true });
  expect(r.status).toBe(400);
  expect(r.body.error).toContain('already holds the role Technology owner');
  const users = (await api('GET', '/api/admin/users')).body.users;
  expect(users.filter(u => u.roles.includes('aiGovernance')).length).toBe(2);
  const me = (await api('GET', '/api/me', undefined, U.technologyOwner)).body;
  expect(me.roles.map(x => x.name)).toEqual(expect.arrayContaining(['Technology owner (company)', 'AI governance team (company)']));
});

test('the AI governance team enters a line, the technology owner confirms it, and a later change withdraws that', async ({ browser }) => {
  await ensureEngagement(browser);
  const ag = await pageAs(browser, U.aiGovernance);
  await open(ag, 'B1');
  await ag.click('[data-act="addLine"]');
  const id = await ag.locator('#invedit strong').first().textContent().then(t => t.replace('Line ', '').trim());
  await ag.locator(`#inv_${id}_use`).fill('Summarising supplier contracts'); await ag.locator(`#inv_${id}_use`).blur();
  await saved(ag);
  await ag.click('[data-act="doneLine"]');
  await expect(ag.locator('#step-B1')).toContainText('Supplied by aiGovernance (test)');
  await expect(ag.locator(`[data-act="confirmLine"][data-id="${id}"]`)).toHaveCount(0);   // the team does not confirm
  expect((await engagement()).inventory.find(l => l.id === id).suppliedBy).toBeTruthy();
  expect(ag._errors).toEqual([]);
  await ag.context().close();

  const cio = await pageAs(browser, U.technologyOwner);
  await expect(cio.locator('#actions')).toContainText('To confirm');
  await open(cio, 'B1');
  await cio.click(`[data-act="confirmLine"][data-id="${id}"]`);
  await saved(cio);
  const line = (await engagement()).inventory.find(l => l.id === id);
  expect(line.confirmedBy).toBeTruthy(); expect(line.confirmedBy).not.toBe(line.suppliedBy);
  expect(cio._errors).toEqual([]);
  await cio.context().close();

  // a change by someone else withdraws the confirmation; the supplier stays
  const r = await editAs(U.aiGovernance2, d => { d.inventory.find(l => l.id === id).use = 'Summarising supplier and customer contracts'; });
  expect(r.status).toBe(200);
  const after = (await engagement()).inventory.find(l => l.id === id);
  expect(after.confirmedBy).toBeUndefined(); expect(after.suppliedBy).toBe(line.suppliedBy);
  // neither role sets a position, and the team cannot confirm
  expect((await editAs(U.aiGovernance, d => { d.positions.B3 = { lines: [{ id: 'RL9', use: 'x', proposedBy: '' }] }; })).status).toBe(403);
  expect((await editAs(U.technologyOwner, d => { d.resolution = { by: 'x', on: '2026-12-01' }; })).status).toBe(403);
  expect((await editAs(U.aiGovernance, d => { d.inventory.find(l => l.id === id).confirmedBy = 'x'; })).status).toBe(403);
});

test('the AI governance team drafts a measure at B7 and cannot change the events or the proposer', async ({ browser }) => {
  await ensureEngagement(browser);
  const ag = await pageAs(browser, U.aiGovernance);
  await open(ag, 'B7');
  await expect(ag.locator('#step-B7')).toContainText('You draft the measures the board will receive');
  await expect(ag.locator('#step-B7 [data-act="addEvent"]')).toHaveCount(0);
  await expect(ag.locator('#step-B7 [data-ppath="proposedBy"]')).toHaveCount(0);
  await ag.locator('#step-B7 [data-act="addMeasure"]').first().click();
  const box = ag.locator('#step-B7 textarea[data-ppath$=".measure"]').last();
  await box.fill('AI uses added without an inventory line'); await box.blur();
  await saved(ag);
  const m = ((await engagement()).positions.B7.measures || []).find(x => x.measure === 'AI uses added without an inventory line');
  expect(m && m.draftedBy).toBeTruthy();
  expect(ag._errors).toEqual([]);
  await ag.context().close();
  // the other position steps stay read-only for the team
  const ag2 = await pageAs(browser, U.aiGovernance2);
  await open(ag2, 'B3');
  await expect(ag2.locator('#step-B3 [data-act="addRedLine"]')).toHaveCount(0);
  await ag2.context().close();
  // the technology owner confirms the draft
  expect((await editAs(U.technologyOwner, d => { const x = d.positions.B7.measures.find(y => y.id === m.id); x.confirmedBy = 'not-me'; })).status).toBe(403);
  const cio = await pageAs(browser, U.technologyOwner);
  await open(cio, 'B7');
  await cio.click(`#step-B7 [data-act="confirmMeasure"][data-id="${m.id}"]`);
  await saved(cio);
  expect(((await engagement()).positions.B7.measures.find(y => y.id === m.id)).confirmedBy).toBeTruthy();
  await cio.context().close();
});

test('the management briefing is recorded before the director briefing goes out', async ({ browser }) => {
  await ensureEngagement(browser);
  const adv = await pageAs(browser, U.advisor);
  await open(adv, 'B0');
  await expect(adv.locator('#mgmt_status')).toContainText('Not yet held');
  await expect(adv.locator('#mgmt_note')).toContainText('has not been recorded');
  await adv.locator('#mgmt_heldOn').fill('2026-11-06'); await adv.locator('#mgmt_heldOn').blur();
  await saved(adv);
  await expect(adv.locator('#mgmt_status')).toContainText('Held 6 November 2026');
  await expect(adv.locator('#mgmt_note')).toContainText('Not yet confirmed as read');
  expect(adv._errors).toEqual([]);
  await adv.context().close();

  const cio = await pageAs(browser, U.technologyOwner);
  await expect(cio.locator('#actions')).toContainText('Management briefing (B0) to read');
  await cio.click('[data-act="goMgmt"]');
  await expect(cio.locator('#mgmtbrief')).toContainText('What the board will not decide');
  await cio.locator('#mgmt_read').check();
  await saved(cio);
  await expect(cio.locator('#mgmt_heldOn')).toHaveCount(0);   // the technology owner does not record the meeting
  expect(cio._errors).toEqual([]);
  await cio.context().close();

  const e = await engagement();
  expect(Object.keys(e.managementBriefing.confirmed).length).toBe(1);
  expect(e.managementBriefing.recordedBy).toBeTruthy();
  // the chair sees who has still to confirm, beside the director briefing
  const chair = await pageAs(browser, U.chair);
  await open(chair, 'B0');
  await expect(chair.locator('#mgmt_note')).toContainText('aiGovernance (test)');
  await expect(chair.locator('#mgmt_note')).not.toContainText('technologyOwner (test)');
  await chair.context().close();
  // a director cannot record or confirm it
  expect((await editAs(U.director, d => { d.managementBriefing.heldOn = '2026-11-07'; })).status).toBe(403);
  expect((await editAs(U.director, d => { d.managementBriefing.confirmed.x = '2026-11-07'; })).status).toBe(403);
});

test('the worked example shows the management briefing, who supplied each line and who confirmed it', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.mo }, viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); } catch (e) {} });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto('/');
  await expect(page.locator('.examplenote', { hasText: 'Worked example:' })).toBeVisible({ timeout: 15_000 });
  await open(page, 'B0');
  await expect(page.locator('#mgmt_status')).toContainText('Held 6 November 2026');
  await expect(page.locator('#step-B0')).toContainText('Nikhil Rao');
  await open(page, 'B1');
  await expect(page.locator('#step-B1')).toContainText('Supplied by Elena Petrova');
  await expect(page.locator('#step-B1')).toContainText('Not confirmed');   // L8, the consumer chatbots, is still open
  await open(page, 'B7');
  await expect(page.locator('#step-B7')).toContainText('Drafted by Elena Petrova');
  expect(errors).toEqual([]);
  await ctx.close();
});
