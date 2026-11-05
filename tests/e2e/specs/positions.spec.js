// B2 to B8: entering the board's positions (task 1.5) and the governance goals at B2 (task 1.13).
import { test, expect } from '@playwright/test';
import { pageAs, U, api, editAs } from '../helpers.js';

async function ensureEngagement(browser) {
  if ((await api('GET', '/api/engagement', undefined, U.mo)).body.exists) return;
  const mo = await pageAs(browser, U.mo);
  await mo.click('[data-act="new"]');
  await expect(mo.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
  await mo.context().close();
}
const open = async (p, step) => { await p.locator(`#step-${step} > summary`).click(); await expect(p.locator(`#step-${step}`)).toHaveAttribute('open', ''); };
const saved = p => expect(p.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
const data = async () => (await api('GET', '/api/engagement', undefined, U.mo)).body.data;
const personId = async email => (await data()).people.find(p => p.name === email || p.id === email || (p.name || '').toLowerCase().includes(email.split('@')[0]))?.id;

test('a director records a governance goal and a posture, with who proposed it', async ({ browser }) => {
  await ensureEngagement(browser);
  const d = await pageAs(browser, U.director);
  await open(d, 'B2');
  await d.click('[data-act="addGoal"]');
  const before = ((await data()).positions.B2 || {}).goals || [];
  const gid = 'GL' + (before.reduce((m, g) => Math.max(m, +g.id.slice(2)), 0) + 1);
  await d.locator(`#p_B2_goals_${gid}_goal`).fill('Use AI where it helps customers, safely');
  await d.locator(`#p_B2_goals_${gid}_owner`).fill('The CEO');
  await d.locator(`#p_B2_goals_${gid}_measure`).fill('Customer complaints about AI, each quarter');
  await d.locator(`#p_B2_goals_${gid}_proposedBy`).selectOption({ index: 1 });
  await d.locator('#p_B2_A1_posture').selectOption('S2');
  await d.locator('#p_B2_A1_condition').fill('A person handles every complaint');
  await d.locator('#p_B2_A1_proposedBy').selectOption({ index: 1 });
  await saved(d);
  const b2 = (await data()).positions.B2;
  expect(b2.A1).toMatchObject({ posture: 'S2', condition: 'A person handles every complaint' });
  expect(b2.A1.proposedBy).toBeTruthy();
  expect(b2.goals.find(g => g.id === gid)).toMatchObject({ goal: 'Use AI where it helps customers, safely', owner: 'The CEO' });
  // the goal's measure is offered at B7, and adding it links the two
  await open(d, 'B7');
  await d.click(`[data-act="goalMeasure"][data-id="${gid}"]`);
  await saved(d);
  expect((await data()).positions.B7.measures.some(m => m.goal === gid && m.measure === 'Customer complaints about AI, each quarter')).toBe(true);
  expect(d._errors).toEqual([]);
  await d.context().close();
});

test('red lines, reserved events, the confidentiality table and accountability are entered', async ({ browser }) => {
  await ensureEngagement(browser);
  const c = await pageAs(browser, U.chair);
  await open(c, 'B3');
  await c.click('[data-act="toggleCand"]');
  const n0 = (((await data()).positions.B3 || {}).lines || []).length;
  const cand = c.locator('[data-act="addRedLine"][data-i]');
  if (await cand.count()) { await cand.first().click(); await saved(c); expect((await data()).positions.B3.lines.length).toBe(n0 + 1); }
  expect((await data()).positions.B3.lines.length).toBeGreaterThan(0);
  await open(c, 'B4');
  const loadB4 = c.locator('[data-act="loadStart"][data-step="B4"]');
  if (await loadB4.count()) { await loadB4.click(); await saved(c); }
  expect((await data()).positions.B4.events.map(e => e.id)).toEqual(expect.arrayContaining(['RV1', 'RV6']));
  await c.locator('#p_B4_events_RV1_timing').fill('Before it starts'); await c.locator('#p_B4_events_RV1_timing').blur();
  await open(c, 'B5');
  await c.locator('#p_B5_cells_G3_K5').selectOption('N');
  await c.locator('#p_B5_cells_G4_K5').selectOption('P');
  await expect(c.locator('#step-B5 [role="alert"]')).toContainText('BK2');
  await c.locator('#p_B5_cells_G4_K5').selectOption('N');
  await expect(c.locator('#step-B5 [role="alert"]')).toHaveCount(0);
  await open(c, 'B8');
  await c.locator('#p_B8_owners_AC1').fill('Audit and risk committee'); await c.locator('#p_B8_owners_AC1').blur();
  await saved(c);
  const e = await data();
  expect(e.positions.B4.events.find(x => x.id === 'RV1').timing).toBe('Before it starts');
  expect(e.positions.B5.cells['G4:K5']).toBe('N');
  expect(e.positions.B8.owners.AC1).toBe('Audit and risk committee');
  expect(c._errors).toEqual([]);
  await c.context().close();
});

test('the advisor and the GC see positions but cannot set them; the advisor logs a question for counsel', async ({ browser }) => {
  await ensureEngagement(browser);
  const a = await pageAs(browser, U.advisor);
  await open(a, 'B6');
  await expect(a.locator('#step-B6 [data-pos]')).toHaveCount(0);
  await a.locator('#step-B6 details summary', { hasText: 'Log a question' }).click();
  await a.locator('#q_B6').fill('Does recording a harm threshold create a standard we will be held to?');
  await a.click('[data-act="askQ"][data-step="B6"]');
  await saved(a);
  const q = (await data()).questions.find(x => x.step === 'B6' && x.question.startsWith('Does recording a harm threshold'));
  expect(q).toMatchObject({ status: 'open' });
  const gc = await pageAs(browser, U.gc);
  await expect(gc.locator('#actions')).toContainText(q.ref);
  await open(gc, 'B2');
  await expect(gc.locator('#step-B2 [data-pos]')).toHaveCount(0);
  // the server refuses a position set by the advisor, and one naming the advisor as proposer
  expect((await editAs(U.advisor, d => { d.positions.B8 = { owners: { AC1: 'Set by the advisor' } }; })).status).toBe(403);
  const advisorId = (await data()).people.find(p => p.roles.includes('advisor')).id;
  expect((await editAs(U.recorder, d => { d.positions.B6 = { harms: { H1: { statement: 'x', proposedBy: advisorId } } }; })).status).toBe(403);
  await a.context().close(); await gc.context().close();
});

test('the worked example lets anyone try the positions and saves nothing', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.advisor } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/'); await expect(p.locator('.examplebar')).toContainText('Worked example');
  await open(p, 'B2');
  await expect(p.locator('#p_B2_goals_GL1_goal')).toHaveValue(/routine work/);
  const rev = (await api('GET', '/api/engagement', undefined, U.advisor)).body.revision;
  await p.locator('#p_B2_A8_posture').selectOption('S3');
  await expect(p.locator('#p_B2_A8_posture')).toHaveValue('S3');
  expect((await api('GET', '/api/engagement', undefined, U.advisor)).body.revision).toBe(rev);
  expect(errs).toEqual([]);
  await ctx.close();
});
