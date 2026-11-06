// B0: the Atlas matter brief (task 1.4), the scope agreement and the director briefing (task 1.12).
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { pageAs, U, api, editAs } from '../helpers.js';

const FIXTURE = new URL('../../fixtures/matter-brief-au.json', import.meta.url).pathname;
async function ensureEngagement(browser) {
  if ((await api('GET', '/api/engagement', undefined, U.mo)).body.exists) return;
  const mo = await pageAs(browser, U.mo);
  await mo.click('[data-act="new"]');
  await expect(mo.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
  await mo.context().close();
}
const openB0 = async p => { await p.locator('#step-B0 > summary').click(); await expect(p.locator('#step-B0')).toHaveAttribute('open', ''); };
const saved = p => expect(p.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
const data = async (as = U.mo) => (await api('GET', '/api/engagement', undefined, as)).body.data;

test('Triodian loads a matter brief from the Atlas; a malformed one is refused with the reason', async ({ browser }) => {
  await ensureEngagement(browser);
  const mo = await pageAs(browser, U.mo);
  await openB0(mo);
  await mo.locator('#brief_file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"briefFormat":"something/else"}') });
  await expect(mo.locator('#toast')).toContainText('This app reads triodian.matterBrief/1');
  await mo.locator('#brief_file').setInputFiles(FIXTURE);
  await expect(mo.locator('#toast')).toContainText('Matter brief loaded: 5 references, 8 questions');
  await saved(mo);
  const mb = (await data()).engagement.matterBrief;
  expect(mb.tiers.map(t => t.tier)).toEqual(['Binding', 'Expected', 'Anticipated']);
  expect(JSON.stringify(mb)).not.toContain('Test matter'); // the matter label is not kept
  await expect(mo.locator('#step-B0')).toContainText('Questions counsel will need to determine');
  if (await mo.locator('[data-act="logBriefQs"]').count()) { await mo.click('[data-act="logBriefQs"]'); await saved(mo); }
  expect((await data()).questions.filter(q => q.source === 'atlas').length).toBe(8);
  await expect(mo.locator('[data-act="logBriefQs"]')).toHaveCount(0);
  // the CEO sees the brief but cannot load one
  const ceo = await pageAs(browser, U.ceo);
  await openB0(ceo);
  await expect(ceo.locator('#step-B0')).toContainText('Obligations in scope');
  await expect(ceo.locator('#brief_file')).toHaveCount(0);
  expect((await editAs(U.ceo, d => { delete d.engagement.matterBrief; })).status).toBe(403);
  expect(mo._errors.concat(ceo._errors)).toEqual([]);
  await mo.context().close(); await ceo.context().close();
});

test('the GC and the chair agree to the scope in their own names', async ({ browser }) => {
  await ensureEngagement(browser);
  // start without agreements, and with the chair as second agreer
  const mo = await pageAs(browser, U.mo);
  await editAs(U.gc, d => { d.scopeAgreed = { ...(d.scopeAgreed || {}), gcBy: '', gcOn: '' }; });
  await mo.context().close();
  const gc = await pageAs(browser, U.gc);
  await openB0(gc);
  await gc.click('[data-act="agree"][data-kind="gc"][data-v="1"]');
  await saved(gc);
  const me = (await api('GET', '/api/me', undefined, U.gc)).body.user;
  expect((await data()).scopeAgreed.gcBy).toBe(me.id);
  await expect(gc.locator('[data-act="agree"][data-kind="chair"]')).toHaveCount(0); // not the GC's to record
  // the chair cannot record the GC's agreement through the API, and nobody records another's
  expect((await editAs(U.chair, d => { d.scopeAgreed.gcBy = ''; })).status).toBe(403);
  expect((await editAs(U.gc, d => { d.scopeAgreed.chairBy = me.id; d.scopeAgreed.chairOn = '2026-11-05'; })).status).toBe(403);
  await gc.context().close();
});

test('where the GC also acts as counsel, the named second approver agrees instead of the chair', async ({ browser }) => {
  await ensureEngagement(browser);
  const ceoId = (await api('GET', '/api/me', undefined, U.ceo)).body.user.id;
  // whoever recorded the second agreement withdraws it (nobody else may)
  const holder = (await data()).scopeAgreed.chairBy;
  if (holder) for (const who of Object.values(U)) if ((await api('GET', '/api/me', undefined, who)).body.user.id === holder) expect((await editAs(who, d => { d.scopeAgreed.chairBy = ''; d.scopeAgreed.chairOn = ''; })).status).toBe(200);
  expect((await editAs(U.mo, d => { d.engagement.gcActsAsCounsel = true; d.engagement.secondApproverId = ceoId; })).status).toBe(200);
  const chairId = (await api('GET', '/api/me', undefined, U.chair)).body.user.id;
  expect((await editAs(U.chair, d => { d.scopeAgreed.chairBy = chairId; d.scopeAgreed.chairOn = '2026-11-05'; })).status).toBe(403);
  const ceo = await pageAs(browser, U.ceo);
  await openB0(ceo);
  await expect(ceo.locator('#step-B0')).toContainText('Second approver');
  await ceo.click('[data-act="agree"][data-kind="chair"][data-v="1"]');
  await saved(ceo);
  expect((await data()).scopeAgreed.chairBy).toBe(ceoId);
  await ceo.context().close();
  // back to the usual arrangement for the other tests
  expect((await editAs(U.mo, d => { d.engagement.gcActsAsCounsel = false; d.engagement.secondApproverId = ''; })).status).toBe(200);
});

test('a director takes the briefing; the record shows the dates; only they and the facilitators see the answers', async ({ browser }) => {
  await ensureEngagement(browser);
  expect((await api('PUT', '/api/briefing', { answers: {}, read: false }, U.director)).status).toBe(200); // start over
  const d = await pageAs(browser, U.director);
  await expect(d.locator('#actions')).toContainText('Director briefing (B0) to complete');
  await d.click('[data-act="goB0"]');
  await expect(d.locator('#briefing')).toHaveAttribute('open', '');
  await expect(d.locator('#briefing')).toContainText('AI in plain terms');
  for (const [q, a] of [['q1', 'A2'], ['q2', 'S3'], ['q3', 'b'], ['q4', 'a']]) {
    await d.locator(`input[name="brief_${q}"][value="${a}"]`).check();
    await expect(d.locator(`input[name="brief_${q}"][value="${a}"]`)).toBeChecked();
  }
  await expect(d.locator('#briefing')).toContainText('Not quite'); // q4: the explanation, not a mark
  await d.locator('#brief_read').check();
  await expect(d.locator('#toast')).toContainText('Briefing complete');
  const dId = (await api('GET', '/api/me', undefined, U.director)).body.user.id;
  const edu = (await data()).education[dId];
  expect(edu.readOn).toMatch(/^\d{4}-\d{2}-\d{2}$/); expect(edu.completedOn).toBe(edu.readOn);
  expect(JSON.stringify(await data())).not.toContain('"q4":"a"'); // answers are not in the engagement
  // who sees the answers
  const mine = (await api('GET', '/api/briefing', undefined, U.director)).body.entries;
  expect(mine.find(x => x.personId === dId).answers.q4).toBe('a');
  expect((await api('GET', '/api/briefing', undefined, U.chair)).body.entries.some(x => x.personId === dId)).toBe(false);
  expect((await api('GET', '/api/briefing', undefined, U.gc)).body.entries.some(x => x.personId === dId)).toBe(false);
  expect((await api('GET', '/api/briefing', undefined, U.advisor)).body.entries.some(x => x.personId === dId)).toBe(true);
  // the record cannot be written through a save, and the CEO does not take the briefing
  expect((await editAs(U.director, x => { x.education[dId] = { readOn: '', completedOn: '' }; })).status).toBe(403);
  expect((await api('PUT', '/api/briefing', { answers: {}, read: true }, U.ceo)).status).toBe(403);
  // the education record and the briefing download as Word
  for (const act of ['educationDocx', 'briefingDocx']) {
    const dl = d.waitForEvent('download');
    await d.click(`[data-act="${act}"]`);
    expect((await dl).suggestedFilename()).toMatch(/\.docx$/);
  }
  expect(d._errors).toEqual([]);
  await d.context().close();
  // the advisor sees the director's answers on screen
  const a = await pageAs(browser, U.advisor);
  await openB0(a);
  await a.locator('#step-B0 summary', { hasText: 'Directors’ answers' }).click();
  await expect(a.locator('#step-B0')).toContainText('Green: the expected answer');
  await a.context().close();
});

test('the worked example: take the briefing as a director; B9 lists directors who have not completed it', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.gc } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/'); await expect(p.locator('.examplebar')).toContainText('Worked example');
  await p.locator('#step-B9 > summary').click();
  await expect(p.locator('#step-B9')).toContainText('not completed: Priya Raman');
  await p.locator('#step-B0 > summary').click();
  await p.locator('#briefing > summary').click();
  for (const [q, a] of [['q1', 'A2'], ['q2', 'S3'], ['q3', 'b'], ['q4', 'b']]) await p.locator(`input[name="brief_${q}"][value="${a}"]`).check();
  await p.locator('#brief_read').check();
  await expect(p.locator('#step-B9')).not.toContainText('not completed');
  expect(errs).toEqual([]);
  await ctx.close();
});
