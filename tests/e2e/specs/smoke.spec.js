// The app, admin, profile and user guide load without script errors; set-up saves; the server enforces the rules.
import { test, expect } from '@playwright/test';
import { pageAs, U, api, editAs, ADMIN } from '../helpers.js';

test('the method owner starts the engagement and set-up saves', async ({ browser }) => {
  const mo = await pageAs(browser, U.mo);
  if (!(await api('GET', '/api/engagement', undefined, U.mo)).body.exists) {
    await mo.click('[data-act="new"]');
    await expect(mo.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
  }
  await mo.fill('#f_engagement_company', 'Acme Pty Ltd');
  await mo.locator('#f_engagement_company').blur();
  await expect(mo.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
  const e = await api('GET', '/api/engagement', undefined, U.mo);
  expect(e.body.data.engagement.company).toBe('Acme Pty Ltd');
  expect(e.body.data.areas.length).toBe(10);
  await expect(mo.locator('.steplist .panel2')).toHaveCount(10);
  expect(mo._errors).toEqual([]);
});

test('everyone can open the engagement; only Triodian or an admin can edit set-up', async ({ browser }) => {
  for (const [k, who] of Object.entries(U)) {
    const p = await pageAs(browser, who);
    await expect(p.locator('.steplist .panel2')).toHaveCount(10);
    const disabled = await p.locator('#f_engagement_company').isDisabled();
    expect(disabled, who).toBe(!['mo', 'recorder'].includes(k));
    expect(p._errors, who).toEqual([]);
    await p.context().close();
  }
});

test('the server refuses what the page would refuse', async () => {
  const r1 = await editAs(U.director, d => { d.engagement.company = 'Changed by a director'; });
  expect(r1.status).toBe(403);
  const r2 = await editAs(U.recorder, d => { d.positions.B2 = { A1: { posture: 'S2', proposedBy: 'nobody' } }; });
  expect(r2.status).toBe(403);
  const r3 = await editAs(U.advisor, d => { d.questions.push({ ref: 'QC-01', question: 'Must the board set this?', status: 'open', sentOn: '2026-11-05' }); });
  expect(r3.status).toBe(200);
});

test('admin, profile and user guide pages load', async ({ browser }) => {
  for (const path of ['/admin/', '/admin/#activity', '/admin/#notifications', '/profile/', '/user-guide/']) {
    const p = await pageAs(browser, ADMIN, path);
    expect(p._errors, path).toEqual([]);
    await p.context().close();
  }
});

test('the app switcher lists the five apps, and the menu links to the other four', async ({ browser }) => {
  const p = await pageAs(browser, U.mo);
  await p.click('.tsu-switch');
  await expect(p.locator('.tsu-card')).toHaveCount(4);
  await expect(p.locator('.tsu-card.is-here h3')).toHaveText('AI Board Direction');
  await expect(p.locator('.tsu-ce h3')).toHaveText('AI Confidentiality Exposure Assessment');
  await p.click('[data-tsu-close]');
  await p.click('header [data-act="drawer"]');
  await expect(p.locator('.drawer a.item[href*="triodian.com"]')).toHaveCount(4);
  await expect(p.locator('.drawer [aria-current="page"]')).toContainText('AI Board Direction');
  expect(p._errors).toEqual([]);
});
