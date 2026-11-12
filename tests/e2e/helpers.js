// Shared helpers: call the API or open a page as a given user.
import { BASE } from './playwright.config.js';
export { BASE };
export const ADMIN = 'damian.hickey@triodian.com';
export const U = {
  mo: 'mo@bd.test', recorder: 'recorder@bd.test', advisor: 'advisor@bd.test', gc: 'gc@bd.test', chair: 'chair@bd.test',
  director: 'director@bd.test', ceo: 'ceo@bd.test', cro: 'cro@bd.test', areaOwner: 'areaowner@bd.test',
  technologyOwner: 'cio@bd.test', aiGovernance: 'aigov@bd.test', aiGovernance2: 'aigov2@bd.test',
};
export const ROLES = { mo: ['methodOwner'], recorder: ['recorder'], advisor: ['advisor'], gc: ['gc'], chair: ['chair'], director: ['director'], ceo: ['ceo'], cro: ['cro'], areaOwner: ['areaOwner'], technologyOwner: ['technologyOwner'], aiGovernance: ['aiGovernance'], aiGovernance2: ['aiGovernance'] };

export async function api(method, path, body, as = ADMIN) {
  const r = await fetch(BASE + path, { method, headers: { 'X-Dev-User': as, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = null; try { json = await r.json(); } catch (e) { /* not JSON */ }
  return { status: r.status, body: json };
}

/** Read the engagement, let `change` edit a copy, save it as `as`. Returns the save response. */
export async function editAs(as, change) {
  const cur = await api('GET', '/api/engagement', undefined, as);
  const data = structuredClone(cur.body.data);
  change(data);
  return api('PUT', '/api/engagement', { revision: cur.body.revision, data }, as);
}

/** A page signed in as `as`, collecting script errors in page._errors. */
export async function pageAs(browser, as, path = '/') {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Dev-User': as }, viewport: { width: 1280, height: 900 } });
  // The demo introduction (public/suite.js) opens once per session; mark it seen so it doesn't cover the app under test.
  // The worked example opens by default; mark it left so tests start in the real engagement (they open it when they need it).
  await ctx.addInitScript(() => { try { sessionStorage.setItem('triodian.suite.seen', '1'); if (!window.__keepExample) sessionStorage.setItem('triodian.example.left', '1'); } catch (e) {} });
  const page = await ctx.newPage();
  page._errors = [];
  page.on('pageerror', e => page._errors.push(String(e)));
  page.on('dialog', d => d.accept());
  await page.goto(path); await page.waitForTimeout(900);
  return page;
}
