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
  await expect(mo.locator('.steplist > details')).toHaveCount(10);
  expect(mo._errors).toEqual([]);
});

test('everyone can open the engagement; only Triodian or an admin can edit set-up', async ({ browser }) => {
  for (const [k, who] of Object.entries(U)) {
    const p = await pageAs(browser, who);
    await expect(p.locator('.steplist > details')).toHaveCount(10);
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
  const r3 = await editAs(U.advisor, d => { d.questions.push({ ref: 'QC-' + String(d.questions.length + 50), question: 'Must the board set this?', status: 'open', sentOn: '2026-11-05' }); });
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

test('the worked example opens, every step shows its record, and nothing is saved', async ({ browser }) => {
  const p = await pageAs(browser, U.director);
  const before = (await api('GET', '/api/engagement', undefined, U.director)).body.revision;
  await p.click('header [data-act="drawer"]');
  await p.click('.drawer [data-act="example"]');
  await expect(p.locator('.examplenote')).toContainText('Worked example');
  await expect(p.locator('h1')).toHaveText('Harrow Valley Foods Pty Ltd');
  for (const id of ['B0', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9']) {
    await p.click(`#step-${id} > summary`);
    await expect(p.locator(`#step-${id} .badge`).first()).toHaveText('Recorded');
  }
  await expect(p.locator('#step-B1 table').first().locator('tbody tr')).toHaveCount(12);
  expect(await p.locator('#step-B9 tbody tr').count()).toBeGreaterThan(0); // the reality note
  await p.click('.examplenote [data-act="leaveExample"]');
  await expect(p.locator('.examplenote')).toHaveCount(0);
  expect((await api('GET', '/api/engagement', undefined, U.director)).body.revision).toBe(before);
  expect(p._errors).toEqual([]);
});

test('codes in the steps explain themselves on hover and on keyboard focus', async ({ browser }) => {
  const p = await pageAs(browser, U.director);
  await p.click('header [data-act="drawer"]');
  await p.click('.drawer [data-act="example"]');
  await p.click('#step-B5 > summary');
  await p.locator('#step-B5 table').first().locator('tbody tr').last().locator('[data-tip]').last().hover();
  await expect(p.locator('#tipbox')).toBeVisible();
  await expect(p.locator('#tipbox')).toContainText('Board and transaction in adviser’s tools: Not permitted');
  await p.locator('#step-B5 table').first().locator('thead [data-tip]').first().hover();
  await expect(p.locator('#tipbox')).toContainText('enterprise assistant');
  await p.click('#step-B7 > summary');
  await p.locator('#step-B7 [data-tip]', { hasText: 'BM1' }).focus();
  await expect(p.locator('#tipbox')).toContainText('BM1 · A board measure (step B7): reported to the board at each meeting.');
  await p.keyboard.press('Escape');
  await expect(p.locator('#tipbox')).toBeHidden();
  expect(p._errors).toEqual([]);
});
