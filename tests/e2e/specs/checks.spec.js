// The checks BK1 to BK7 (task 1.7) on screen: they update as positions change, and link to the step to fix.
import { test, expect } from '@playwright/test';
import { pageAs, U, api, editAs } from '../helpers.js';

async function ensureEngagement(browser) {
  if ((await api('GET', '/api/engagement', undefined, U.mo)).body.exists) return;
  const mo = await pageAs(browser, U.mo);
  await mo.click('[data-act="new"]');
  await expect(mo.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
  await mo.context().close();
}

test('a red line not tested against the inventory fails BK4 until it is tested', async ({ browser }) => {
  await ensureEngagement(browser);
  let rid = '';
  expect((await editAs(U.recorder, d => {
    d.positions.B3 = d.positions.B3 || {}; d.positions.B3.lines = d.positions.B3.lines || [];
    rid = 'RL' + (d.positions.B3.lines.reduce((m, l) => Math.max(m, +String(l.id).slice(2) || 0), 0) + 1);
    d.positions.B3.lines.push({ id: rid, use: 'AI deciding refunds with no person reviewing them', scope: 'All areas', appliesTo: 'The company' });
  })).status).toBe(200);
  const ch = await pageAs(browser, U.chair);
  const bk4 = ch.locator('#checks [data-check="BK4"]');
  await expect(bk4).toContainText(`${rid}: not yet tested against the inventory.`);
  await bk4.locator('summary').click();
  await bk4.locator('[data-act="goStep"][data-step="B3"]').first().click();
  await expect(ch.locator('#step-B3')).toHaveAttribute('open', '');
  await ch.locator(`#p_B3_lines_${rid}_testedAgainst`).selectOption('none');
  await expect(ch.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
  await expect(bk4).not.toContainText(`${rid}: not yet tested`);
  expect(ch._errors).toEqual([]);
  await ch.context().close();
});

test('the worked example passes all seven checks, and B9 shows the red line its inventory crosses', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.gc } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/'); await expect(p.locator('.examplebar')).toContainText('Worked example');
  await expect(p.locator('#checks')).toContainText('7 of 7 pass');
  await p.locator('#step-B9 > summary').click();
  await expect(p.locator('#step-B9')).toContainText('crosses red line RL2');
  // breaking a position in the example shows a failure at once
  await p.locator('#step-B5 > summary').click();
  await p.locator('#p_B5_cells_G6_K1').selectOption('P');
  await expect(p.locator('#checks')).toContainText('6 of 7 pass');
  await expect(p.locator('#checks [data-check="BK2"]')).toContainText('1 to resolve');
  expect(errs).toEqual([]);
  await ctx.close();
});
