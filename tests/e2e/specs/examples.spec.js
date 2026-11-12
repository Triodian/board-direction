// Worked examples by sector. Triodian Start opens the app on one with ?example=<sector>; the choice holds for the
// browser session, and the menu offers the others. The superannuation example (Coastline Super, fictional) is in
// connected mode and is the same fund as the worked examples in AI Risk Appetite and AI Use Assessment.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { pageAs, U, api } from '../helpers.js';

function unzip(buf, name) {
  let e = buf.length - 22; while (e > 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  let p = buf.readUInt32LE(e + 16);
  for (let n = buf.readUInt16LE(e + 10); n > 0; n--) {
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    if (buf.toString('utf8', p + 46, p + 46 + nl) === name) { const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28), raw = buf.subarray(start, start + size); return (method ? inflateRawSync(raw) : raw).toString('utf8'); }
    p += 46 + nl + xl + cl;
  }
  return '';
}
const text = xml => xml.replace(/<w:tab\/>/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, '’');
async function grab(page, id) {
  const dl = page.waitForEvent('download');
  await page.click(`#outputs [data-act="output"][data-id="${id}"]`);
  const d = await dl; return { name: d.suggestedFilename(), buf: readFileSync(await d.path()) };
}


test('?example=superannuation opens Coastline Super in connected mode, and the choice holds on reload', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.gc }, acceptDownloads: true });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/?example=superannuation');
  await expect(p.locator('.examplenote').first()).toContainText('a fictional superannuation trustee, Coastline Super');
  await expect(p).toHaveURL(/\/$/);                                   // the link's parameter is taken off the address
  await p.goto('/?other=1&example=superannuation');                // only its own parameter is removed, so the suite's stays for the suite to read
  await expect(p).toHaveURL(/\/\?other=1(#.*)?$/);
  await expect(p.locator('.examplenote', { hasText: 'Coastline Super' }).first()).toBeVisible({ timeout: 15_000 });
  await expect(p.locator('body')).toContainText('Coastline Super');
  await expect(p.locator('body')).toContainText('Connected mode');
  await expect(p.locator('body')).not.toContainText('Harrow Valley Foods');
  const open = async id => { const d = p.locator(`#step-${id}`); if ((await d.getAttribute('open')) == null) await p.locator(`#step-${id} > summary`).click(); };
  await open('B0');
  await expect(p.locator('#step-B0')).toContainText('Superannuation trustee');
  await expect(p.locator('#mgmt_status')).toContainText('Held 8 October 2026');
  await expect(p.locator('#step-B0')).toContainText('Common failures in superannuation');
  await open('B1');
  await expect(p.locator('#step-B1')).toContainText('Sorting death and disablement claims into fast-track or full review');
  await expect(p.locator('#step-B1')).toContainText('Supplied by Callum Brandt');
  await open('B2');
  await expect(p.locator('#step-B2')).toContainText('A person decides every death or disablement claim');
  await open('B9');
  await expect(p.locator('#step-B9')).toContainText('Recorded by Helen Marchetti on 28 October 2026 (version V2)');
  await expect(p.locator('#checks')).toContainText('7 of 7 pass');
  // connected mode: the directions paper, not the statement; each document downloads as Word
  await expect(p.locator('#outputs [data-id="statement"]')).toHaveCount(0);
  const want = { directions: 'A person decides every death or disablement claim', minute: 'Board minute 2026/11-07', actionList: 'L3', crosswalk: '13 lines, 12 confirmed by the technology owner', plan: 'Where it stands', worklist: 'Automated-decision worklist', education: 'Director education record' };
  for (const [id, phrase] of Object.entries(want)) {
    const f = await grab(p, id);
    expect(f.name).toMatch(/\.docx$/);
    expect(text(unzip(f.buf, 'word/document.xml')), id).toContain(phrase);
    expect(text(unzip(f.buf, 'word/footer1.xml')), id + ' footer').toContain('Resolved by the board, version V3, 25 November 2026');
  }
  // the choice holds on a plain reload
  await p.goto('/');
  await expect(p.locator('.examplenote').first()).toContainText('Coastline Super');
  // nothing was saved
  expect((await api('GET', '/api/engagement', undefined, U.mo)).body.data?.engagement?.company || '').not.toContain('Coastline');
  expect(errs).toEqual([]);
  await ctx.close();
});

test('the menu offers the other example, and a link for a sector this app has no example for opens the first', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.gc } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/');
  await expect(p.locator('.examplenote').first()).toContainText('a fictional company, board and advisers');   // the default is unchanged
  await expect(p.locator('body')).toContainText('Harrow Valley Foods');
  await p.locator('[data-act="drawer"]').first().click();
  await expect(p.locator('[data-act="example"][data-ex="unregulated"]')).toHaveCount(0);                         // already open
  await p.locator('[data-act="example"][data-ex="superannuation"]').click();
  await expect(p.locator('.examplenote').first()).toContainText('Coastline Super');
  await p.locator('[data-act="drawer"]').first().click();
  await p.locator('[data-act="example"][data-ex="unregulated"]').click();
  await expect(p.locator('body')).toContainText('Harrow Valley Foods');
  await p.goto('/?example=banking');                                                                             // not written yet
  await expect(p.locator('body')).toContainText('Harrow Valley Foods');
  // leaving, then a sector link: the link always opens the example
  await p.locator('[data-act="leaveExample"]').first().click();
  await expect(p.locator('.examplenote')).toHaveCount(0);
  await p.goto('/?example=superannuation');
  await expect(p.locator('.examplenote').first()).toContainText('Coastline Super');
  expect(errs).toEqual([]);
  await ctx.close();
});

test('?example=insurance opens Corvane General Insurance: directions recorded, the board yet to resolve', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.gc }, acceptDownloads: true });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/?example=insurance');
  await expect(p.locator('.examplenote').first()).toContainText('a fictional general insurer, Corvane General Insurance');
  await expect(p.locator('body')).toContainText('Connected mode');
  await expect(p.locator('body')).not.toContainText('Coastline Super');
  const open = async id => { const d = p.locator(`#step-${id}`); if ((await d.getAttribute('open')) == null) await p.locator(`#step-${id} > summary`).click(); };
  await open('B0');
  await expect(p.locator('#step-B0')).toContainText('General insurer');
  await expect(p.locator('#mgmt_status')).toContainText('Held 3 September 2026');
  await expect(p.locator('#step-B0')).toContainText('Common failures in general insurance');
  await open('B1');
  await expect(p.locator('#step-B1')).toContainText('Routing motor claims to fast-track payment or investigation');
  await expect(p.locator('#step-B1')).toContainText('Supplied by Tobias Reed');
  await open('B2');
  await expect(p.locator('#step-B2')).toContainText('A person decides every decline');
  await open('B9');
  await expect(p.locator('#step-B9')).toContainText('Recorded by Margaret Osei on 24 September 2026 (version V2)');
  await expect(p.locator('#step-B9')).not.toContainText('Resolved by the board');
  await expect(p.locator('#checks')).toContainText('7 of 7 pass');
  // the directions paper and the working documents download as Word, in the insurer's words
  const want = { directions: 'A person decides every decline', actionList: 'L3', crosswalk: '13 lines, 12 confirmed by the technology owner', plan: 'Where it stands', worklist: 'Automated-decision worklist' };
  for (const [id, phrase] of Object.entries(want)) {
    const f = await grab(p, id);
    expect(f.name).toMatch(/\.docx$/);
    expect(text(unzip(f.buf, 'word/document.xml')), id).toContain(phrase);
    expect(text(unzip(f.buf, 'word/document.xml')), id).not.toContain('Coastline');
  }
  // the menu offers the other two
  await p.locator('[data-act="drawer"]').first().click();
  await expect(p.locator('[data-act="example"][data-ex="insurance"]')).toHaveCount(0);
  await expect(p.locator('[data-act="example"][data-ex]')).toHaveCount(2);
  expect((await api('GET', '/api/engagement', undefined, U.mo)).body.data?.engagement?.company || '').not.toContain('Corvane');
  expect(errs).toEqual([]);
  await ctx.close();
});
