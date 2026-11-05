// B1: the AI inventory (tasks 1.6) and the automated-decision flag with counsel's worklist (task 1.11).
import { test, expect } from '@playwright/test';
import { pageAs, U, api, editAs } from '../helpers.js';

async function ensureEngagement(browser) {
  if ((await api('GET', '/api/engagement', undefined, U.mo)).body.exists) return;
  const mo = await pageAs(browser, U.mo);
  await mo.click('[data-act="new"]');
  await expect(mo.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
  await mo.context().close();
}
const openB1 = async p => { await p.locator('#step-B1 summary').click(); await expect(p.locator('#step-B1')).toHaveAttribute('open', ''); };

test('the CEO adds a line, marks it as deciding about individuals, and a question goes to counsel', async ({ browser }) => {
  await ensureEngagement(browser);
  const ceo = await pageAs(browser, U.ceo);
  await openB1(ceo);
  await ceo.click('[data-act="addLine"]');
  const id = await ceo.locator('#invedit strong').first().textContent().then(t => t.replace('Line ', '').trim());
  const f = k => ceo.locator(`#inv_${id}_${k}`);
  await f('use').fill('Screening loan applications'); await f('tool').fill('Lending platform scoring');
  await f('area').selectOption({ index: 1 }); await f('who').fill('Staff');
  await f('authority').selectOption('A2'); await f('info').selectOption('G4'); await f('kind').selectOption('K2');
  await f('owner').selectOption({ index: 1 });
  await f('adm').check();
  await expect(ceo.locator('#toast')).toContainText('raised to counsel');
  await f('decisions').fill('Whether an application goes to a credit officer'); await f('personalInfo').fill('Income, credit history');
  await f('personalInfo').blur();
  await expect(ceo.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
  // the worklist shows the line, and the Word download works
  await expect(ceo.locator('#step-B1')).toContainText('Automated-decision worklist');
  await expect(ceo.locator('#step-B1 table').nth(1)).toContainText('Income, credit history');
  const dl = ceo.waitForEvent('download');
  await ceo.click('[data-act="worklistDocx"]');
  const file = await dl;
  expect(file.suggestedFilename()).toMatch(/^Automated-decision worklist.*\.docx$/);

  const e = (await api('GET', '/api/engagement', undefined, U.ceo)).body.data;
  const line = e.inventory.find(l => l.id === id);
  expect(line).toMatchObject({ use: 'Screening loan applications', authority: 'A2', info: 'G4', kind: 'K2', adm: true, personalInfo: 'Income, credit history' });
  const q = e.questions.find(x => (x.lines || []).includes(id));
  expect(q).toMatchObject({ step: 'B1', status: 'open' });
  // unticking and ticking again raises no second question
  await f('adm').uncheck(); await f('adm').check();
  await expect(ceo.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
  const e2 = (await api('GET', '/api/engagement', undefined, U.ceo)).body.data;
  expect(e2.questions.filter(x => (x.lines || []).includes(id)).length).toBe(1);
  // the mode is now fixed
  expect((await editAs(U.mo, d => { d.engagement.mode = 'connected'; })).status).toBe(403);
  expect(ceo._errors).toEqual([]);
  await ceo.context().close();
});

test('only the CEO and Triodian change the inventory', async ({ browser }) => {
  await ensureEngagement(browser);
  const dir = await pageAs(browser, U.director);
  await openB1(dir);
  await expect(dir.locator('[data-act="addLine"]')).toHaveCount(0);
  await expect(dir.locator('[data-act="editLine"]')).toHaveCount(0);
  await dir.context().close();
  const r = await editAs(U.director, d => { d.inventory.push({ id: 'L' + (900 + d.inventory.length), use: 'Added by a director' }); });
  expect(r.status).toBe(403);
  const r2 = await editAs(U.recorder, d => { d.inventory.push({ id: 'L' + (800 + d.inventory.length), use: 'Added by Triodian' }); });
  expect(r2.status).toBe(200);
});

test('a line can be removed, with a second click to confirm', async ({ browser }) => {
  await ensureEngagement(browser);
  const mo = await pageAs(browser, U.mo);
  await openB1(mo);
  const before = (await api('GET', '/api/engagement', undefined, U.mo)).body.data.inventory.length;
  await mo.click('[data-act="addLine"]');
  await mo.click('[data-act="delLine"]');
  await expect(mo.locator('[data-act="delLine"]')).toHaveText(/Confirm/);
  await mo.click('[data-act="delLine"]');
  await expect(mo.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
  expect((await api('GET', '/api/engagement', undefined, U.mo)).body.data.inventory.length).toBe(before);
  await mo.context().close();
});

test('the worked example lets anyone try the inventory and saves nothing', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.director } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/'); await expect(p.locator('.examplebar')).toContainText('Worked example');
  await openB1(p);
  await expect(p.locator('#step-B1')).toContainText('Automated-decision worklist');
  await expect(p.locator('#step-B1')).toContainText('CVs, work history');
  const before = (await api('GET', '/api/engagement', undefined, U.director)).body.revision;
  await p.click('[data-act="addLine"]');
  await p.locator('#inv_L9_use').fill('Practice line'); await p.locator('#inv_L9_adm').check();
  await expect(p.locator('#toast')).toContainText('QC-04');
  expect((await api('GET', '/api/engagement', undefined, U.director)).body.revision).toBe(before);
  expect(errs).toEqual([]);
  await ctx.close();
});
