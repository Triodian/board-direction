// The APRA letter evidence index (development plan task R.2). In connected mode the outputs gather the artefacts of
// AI Risk Appetite and AI Use Assessment over the service bindings, and the index lists them by letter bullet or by
// ISO/IEC 42001 control, each showing its evidence or "none yet". Here the link is stubbed; the whole chain runs in
// triodian-install's suite/chain test.
import { test, expect } from '@playwright/test';
import { api, U } from '../helpers.js';
import { appetiteArtefacts, assessmentArtefacts, FORMAT } from '../../../public/shared/evidence.js';

const gathered = {
  format: FORMAT, app: 'RA', company: 'Coastline Super', notes: [],
  // the client's Statement of Applicability, as AI Risk Appetite passes it on (task ISO.5)
  soa: [{ control: 'A.10.3', title: 'Suppliers', applicable: true, justification: 'Material service providers', implemented: 'partly' }, { control: 'A.5.2', title: 'AI system impact assessment process', applicable: true, justification: 'Every arrangement at A3 or above', implemented: 'partly' }, { control: 'A.8.2', title: 'System documentation and information for users', applicable: false, justification: 'Members are not users of the AI systems', implemented: '' }],
  artefacts: [
    ...appetiteArtefacts({ calibration: { status: 'approved', version: 2, approvedOn: '2026-10-30', minuteRef: 'BM-7' }, inUse: { on: '2026-10-28', measures: [] }, challenge: [] }, '2026-11-01'),
    ...assessmentArtefacts({ engagement: {}, entries: [{ id: 'REG-001', arrangementId: 'ARR-01', fields: { 3: { value: 'B1' } } }], questions: [], versions: [{ label: 'Set agreed (R1)', at: '2026-10-05T00:00:00Z' }, { label: 'Counsel review recorded (R6)', at: '2026-10-20T00:00:00Z' }] }, '2026-11-01'),
  ],
};

test('in connected mode the outputs gather the evidence and index it by letter bullet and by ISO/IEC 42001 control', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.chair }, viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); sessionStorage.setItem('triodian.example.left', '1'); } catch (e) {} });
  const data = { schema: 'triodian.bd.v1', engagement: { id: 'eev', company: 'Coastline Super', entityType: 'superannuationTrustee', jurisdiction: 'AU', sector: 'AU-SUPERANNUATION', mode: 'connected', sectorPack: 'superTrustee', reference: 'BD-1', privilegeMarking: '', practitioner: { firm: '', line: '' }, boardDates: { workshop: '', resolution: '' }, managementReview: '2027-03-31', gcActsAsCounsel: false, secondApproverId: '' },
    areas: [{ id: 'A1', name: 'Member services' }], scopeAgreed: {}, inventory: [{ id: 'INV-1', name: 'Claims triage', area: 'A1' }], positions: {}, questions: [], resolution: {}, directions: { by: 'u1', on: '2026-10-02' }, people: [], versions: [], previous: null, history: [] };
  await ctx.route('**/api/engagement', route => route.request().method() === 'GET' ? route.fulfill({ json: { exists: true, revision: 1, data, people: [] } }) : route.fulfill({ json: { revision: 2 } }));
  await ctx.route('**/api/evidence-from-appetite', route => route.fulfill({ json: gathered }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/');
  const card = p.locator('#evidence');
  await expect(card).toContainText('APRA letter evidence index (BO7)');
  await expect(card.locator('[data-ev="G3"]')).toContainText('AI inventory (B1)'); // this engagement's own
  await expect(card.locator('[data-ev="P2"]')).toContainText('none yet'); // nothing from the providers until gathered
  await p.click('[data-act="gatherEvidence"]');
  await expect(card).toContainText('Gathered from AI Risk Appetite and AI Use Assessment');
  await expect(card.locator('[data-ev="G3"]')).toContainText('AI dependency register');
  await expect(card.locator('[data-ev="B2"]')).toContainText('AI risk appetite statement');
  await expect(card.locator('[data-ev="S3"]')).toContainText('none yet');
  await expect(card).toContainText('Review dates follow the AI management review on 31 March 2027');
  await p.selectOption('#ev-by', 'iso');
  // Tasks ISO.2 and ISO.5: every Annex A control is listed; nothing is evidence for A.5; the Statement of Applicability sits beside each control.
  await expect(card.locator('[data-ev^="A."]')).toHaveCount(38);
  await expect(card.locator('[data-ev="A.10.3"]')).toContainText('AI dependency register');
  await expect(card.locator('[data-ev="A.10.3"]')).toContainText('Statement of Applicability: applies · implemented in part · Material service providers');
  for (const id of ['A.5.2', 'A.5.3', 'A.5.4', 'A.5.5']) { await expect(card.locator(`[data-ev="${id}"]`)).toContainText('not evidenced by this suite'); await expect(card.locator(`[data-ev="${id}"]`)).not.toContainText('AI dependency register'); }
  await expect(card.locator('[data-ev="A.8.2"]')).toContainText('Statement of Applicability: does not apply');
  await expect(card.locator('[data-ev="A.7.4"]')).toContainText('Statement of Applicability: not listed');
  await expect(card.locator('[data-ev="A.2.2"]')).toContainText('Board directions paper');
  await expect(card.locator('[data-ev="6.2"]')).toContainText('Board directions paper');           // the board's goals are AI objectives
  await expect(card.locator('[data-ev="A.3.2"]')).toContainText('Board directions paper');         // and its owners are roles and responsibilities
  await expect(p.locator('#ev-iso-note')).toContainText('No output is an AI system impact assessment (A.5)');
  await expect(p.locator('#ev-iso-note')).toContainText('lists 3 controls, 2 of which apply; the outputs evidence 1 of those');
  const md = await p.evaluate(() => window.BDApp.evidenceMarkdown('letter'));
  expect(md).toContain('# APRA letter evidence index');
  expect(md).toMatch(/## G3 · An inventory of AI tooling and use cases[^]*\| AI Use Assessment \| AI dependency register \| Recorded \| 2026-10-20 \| 2027-03-31 \|/);
  expect(md).toMatch(/## S3 [^\n]*\n\n[^\n]*\n\nNone yet\./);
  const mi = await p.evaluate(() => window.BDApp.evidenceMarkdown('iso'));
  expect(mi).toMatch(/## A\.10\.3 · Suppliers\n\nLetter bullets: S4, P1, P2, P4\. Statement of Applicability: applies · implemented in part · Material service providers\.\n\n\| App[^]*?AI dependency register/);
  expect(mi).toMatch(/## A\.5\.2 · AI system impact assessment process\n\n[^\n]*\n\nNot evidenced by this suite\.\n\nInput only: the board’s harm thresholds \(B6\)[^\n]*From: Board directions paper\./);
  expect(mi).toContain('2 of 3 controls listed apply. Of those, the suite’s outputs evidence 1 and do not evidence 1.');
  expect(md + mi).not.toMatch(/\b(must|required)\b/i);
  // every output in the list is tagged
  await expect(p.locator('#outputs')).toContainText('APRA letter B2, G1, G4 · ISO/IEC 42001 5.2, A.2.2, 6.2, A.3.2, A.9.3');
  expect(errs).toEqual([]);
  await ctx.close();
});

test('the link to AI Risk Appetite for the evidence answers with the reason when it is not reached', async () => {
  const r = await api('GET', '/api/evidence-from-appetite');
  expect([502, 503]).toContain(r.status);
  expect(r.body.error).toMatch(/Risk Appetite app/);
});
