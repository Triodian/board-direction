// Practitioner branding (development plan task 0.4). The same check as in the other Triodian apps, plus the logo set-up:
// the method owner records a firm and a PNG logo; the firm shows beside the privilege marking, and the Word worklist
// carries the firm, its line and the logo above the marking. A logo that is not a PNG, or is over 100 KB, is refused.
import { test, expect } from '@playwright/test';
import { inflateRawSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { pageAs, U, api, editAs } from '../helpers.js';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
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

test('the method owner sets the firm and logo; the header and the Word worklist carry them', async ({ browser }) => {
  if (!(await api('GET', '/api/engagement', undefined, U.mo)).body.exists) {
    const p0 = await pageAs(browser, U.mo); await p0.click('[data-act="new"]'); await expect(p0.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 }); await p0.context().close();
  }
  const mo = await pageAs(browser, U.mo);
  await mo.locator('#f_engagement_practitioner_firm').fill('Northgate Legal');
  await mo.locator('#f_engagement_practitioner_line').fill('Prepared by Northgate Legal using the Triodian method');
  await mo.locator('#f_engagement_practitioner_line').blur();
  await mo.setInputFiles('#brand-logo', { name: 'logo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(mo.locator('#toast')).toContainText('must be a PNG');
  await mo.setInputFiles('#brand-logo', { name: 'big.png', mimeType: 'image/png', buffer: Buffer.concat([PNG, Buffer.alloc(110 * 1024)]) });
  await expect(mo.locator('#toast')).toContainText('100 KB or less');
  await mo.setInputFiles('#brand-logo', { name: 'logo.png', mimeType: 'image/png', buffer: PNG });
  await expect(mo.locator('#toast')).toContainText('Logo recorded');
  await expect(mo.locator('#savechip')).toHaveText(/Saved/, { timeout: 10_000 });
  await expect(mo.locator('.brandchip')).toContainText('Northgate Legal');
  const e = (await api('GET', '/api/engagement', undefined, U.mo)).body.data.engagement;
  expect(e.practitioner).toMatchObject({ firm: 'Northgate Legal', line: 'Prepared by Northgate Legal using the Triodian method', logo: 'data:image/png;base64,' + PNG.toString('base64') });

  // the server refuses a logo that is not a PNG, whatever the browser sends
  const bad = JSON.parse(JSON.stringify((await api('GET', '/api/engagement', undefined, U.mo)).body));
  bad.data.engagement.practitioner.logo = 'data:image/svg+xml;base64,PHN2Zy8+';
  const r = await api('PUT', '/api/engagement', { data: bad.data, revision: bad.revision }, U.mo);
  expect(r.status).toBe(400); expect(JSON.stringify(r.body)).toContain('PNG');

  // the Word worklist carries the branding (it needs one line that decides about individuals)
  if (!((await api('GET', '/api/engagement', undefined, U.mo)).body.data.inventory || []).some(l => l.adm)) {
    const w = await editAs(U.mo, d => { d.inventory = d.inventory || []; d.inventory.push({ id: 'L90', use: 'Shortlisting applicants', tool: 'Recruitment platform', area: (d.areas[0] || {}).id || '', who: 'Staff', authority: 'A2', info: 'G4', kind: 'K2', adm: true, decisions: 'Who is interviewed', personalInfo: 'CVs', owner: '', source: 'Test' }); });
    expect(w.status).toBe(200);
  }
  await mo.reload(); await mo.locator('#step-B1 > summary').click();
  const dl = mo.waitForEvent('download');
  await mo.click('[data-act="worklistDocx"]');
  const buf = readFileSync(await (await dl).path()), head = unzip(buf, 'word/header1.xml');
  expect(head).toContain('Northgate Legal'); expect(head).toContain('Prepared by Northgate Legal using the Triodian method'); expect(head).toMatch(/<w:drawing[ >]/);
  expect(unzip(buf, 'docProps/core.xml')).toContain('<dc:creator>Northgate Legal</dc:creator>');
  // someone without set-up rights cannot change the logo
  const ceo = await pageAs(browser, U.ceo);
  await expect(ceo.locator('#brand-logo')).toBeDisabled();
  await mo.context().close(); await ceo.context().close();
});

test('the worked example shows its practitioner’s branding', async ({ browser }) => {
  const p = await pageAs(browser, U.director);
  await p.click('header [data-act="drawer"]'); await p.click('.drawer [data-act="example"]');
  await expect(p.locator('.brandchip')).toContainText('Kestrel Board Advisory');
  await expect(p.locator('.brandchip img')).toHaveCount(1);
  await p.context().close();
});
