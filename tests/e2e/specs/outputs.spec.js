// The outputs (task 1.8): each downloads and opens as Word (or JSON), with the marking and the status on every page.
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

test('the worked example: every output downloads, opens as Word, and carries the marking and status', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': U.gc }, acceptDownloads: true });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('/'); await expect(p.locator('.examplebar')).toContainText('Worked example');
  await expect(p.locator('#outputs')).toContainText('Resolved by the board');
  const want = { statement: '1. Purpose and scope', aupOutline: 'This outline is not a policy', minute: 'Board minute 2026/12-04', actionList: 'Crosses red line RL2', worklist: 'Automated-decision worklist', plan: 'Where it stands', education: 'Director education record' };
  for (const [id, phrase] of Object.entries(want)) {
    const f = await grab(p, id);
    expect(f.name).toMatch(/\.docx$/);
    const body = text(unzip(f.buf, 'word/document.xml'));
    expect(body, id).toContain(phrase);
    const foot = text(unzip(f.buf, 'word/footer1.xml')), headx = text(unzip(f.buf, 'word/header1.xml'));
    expect(foot, id + ' footer').toContain('Resolved by the board, 2 December 2026');
    expect(headx, id + ' header').toContain('Privileged and confidential');
  }
  const j = await grab(p, 'confidentiality');
  expect(j.name).toMatch(/\.json$/);
  const conf = JSON.parse(j.buf.toString('utf8'));
  expect(conf.format).toBe('triodian.bd.confidentiality.v1');
  expect(Object.keys(conf.markings).length).toBe(36);
  // standalone: no directions paper
  await expect(p.locator('#outputs [data-id="directions"]')).toHaveCount(0);
  expect(errs).toEqual([]);
  await ctx.close();
});

test('a live engagement’s outputs are marked draft on every page', async ({ browser }) => {
  if (!(await api('GET', '/api/engagement', undefined, U.mo)).body.exists) {
    const mo = await pageAs(browser, U.mo); await mo.click('[data-act="new"]'); await expect(mo.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 }); await mo.context().close();
  }
  const ceo = await pageAs(browser, U.ceo);
  await expect(ceo.locator('#outputs')).toContainText('Draft, not resolved by the board');
  const f = await grab(ceo, 'actionList');
  expect(text(unzip(f.buf, 'word/footer1.xml'))).toContain('Draft, not resolved by the board');
  expect(ceo._errors).toEqual([]);
  await ceo.context().close();
});
