// Server-side permission check for engagement saves. The rules themselves (deny) are shared with the browser in
// public/shared/rules.js; this file applies them to what actually changed between the stored engagement and the one
// being saved. Cloud-neutral: no Cloudflare, AWS or Azure code here.
import { deny, proposerError, POSITION_STEPS } from './rules.js';
import { storedBriefError } from '../../public/shared/matter-brief.js';
import { withVersions } from './versions.js';

const IDRE = /^[A-Za-z0-9_.:-]{1,64}$/;
const MODES = ['standalone', 'connected'];

export function stable(v) {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
const same = (a, b) => stable(a) === stable(b);
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
/** Shown by the browser only; never stored. */
const CLIENT_ONLY = ['loadNotes', 'savedAt', 'note'];
const KNOWN = ['schema', 'engagement', 'areas', 'scopeAgreed', 'inventory', 'positions', 'questions', 'resolution', 'people', 'versions', 'previous', 'history', 'education'];
const keysOf = (a, b) => [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])];
const byKey = (arr, k) => new Map((Array.isArray(arr) ? arr : []).filter(isObj).map(x => [String(x[k]), x]));
const isPrefix = (oldArr, newArr, ignore = []) => {
  if (!Array.isArray(newArr) || newArr.length < oldArr.length) return false;
  const strip = x => { if (!isObj(x)) return x; const c = { ...x }; ignore.forEach(k => delete c[k]); return c; };
  return oldArr.every((x, i) => same(strip(x), strip(newArr[i])));
};

/** The engagement's people list comes from the user list: everyone with at least one engagement role. */
export function buildPeople(users) {
  return users.filter(u => (u.roles || []).length).map(u => ({ id: u.id, name: u.name || u.email, organisation: u.organisation || '', roles: u.roles.slice(), active: !!u.active }));
}

/** Practitioner branding (development plan task 0.4): a firm, a line under it and a PNG logo of 100 KB at most.
 *  The browser applies the same rule in public/brand.js. Returns a message, or '' when it is sound. */
function practitionerError(p) {
  if (p == null) return '';
  if (typeof p !== 'object' || Array.isArray(p)) return 'The practitioner details are not valid.';
  if (p.firm != null && (typeof p.firm !== 'string' || p.firm.length > 200)) return 'The practitioner firm must be text of 200 characters or less.';
  if (p.line != null && (typeof p.line !== 'string' || p.line.length > 300)) return 'The line under the firm must be text of 300 characters or less.';
  if (p.logo != null && p.logo !== '') {
    const m = typeof p.logo === 'string' && /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(p.logo);
    if (!m || !m[1].startsWith('iVBORw0KGgo')) return 'The logo must be a PNG image.';
    if (Math.floor(m[1].length * 3 / 4) > 100 * 1024 + 2) return 'The logo must be 100 KB or less.';
  }
  return '';
}

/** The shape every save must have. Returns a message, or '' when the shape is sound. */
export function structureError(d) {
  if (!isObj(d.engagement)) return 'The engagement details are missing.';
  { const pe = practitionerError(d.engagement.practitioner); if (pe) return pe; }
  if (d.engagement.mode != null && !MODES.includes(d.engagement.mode)) return 'The mode must be standalone or connected.';
  if (d.engagement.sectorPack != null && !(typeof d.engagement.sectorPack === 'string' && /^[A-Za-z]{0,40}$/.test(d.engagement.sectorPack))) return 'The sector pack is not valid.';
  const lists = { areas: 'id', inventory: 'id', questions: 'ref', history: null, versions: null };
  for (const [name, key] of Object.entries(lists)) {
    const v = d[name];
    if (v == null) continue;
    if (!Array.isArray(v)) return `"${name}" must be a list.`;
    const seen = new Set();
    for (let i = 0; i < v.length; i++) {
      const x = v[i];
      if (!isObj(x)) return `Item ${i + 1} of "${name}" is not valid.`;
      if (!key) continue;
      const k = x[key];
      if (typeof k !== 'string' || !IDRE.test(k)) return `Item ${i + 1} of "${name}" has no valid ${key}.`;
      if (seen.has(k)) return `"${k}" appears twice in "${name}".`;
      seen.add(k);
    }
  }
  if (d.positions != null) {
    if (!isObj(d.positions)) return 'The positions must be a record.';
    for (const [k, v] of Object.entries(d.positions)) {
      if (!POSITION_STEPS.includes(k)) return `"${k}" is not a step with positions.`;
      if (!isObj(v)) return `The positions for ${k} must be a record.`;
    }
  }
  for (const k of ['scopeAgreed', 'resolution', 'education']) if (d[k] != null && !isObj(d[k])) return `"${k}" is not valid.`;
  const mb = storedBriefError(d.engagement.matterBrief); if (mb) return mb;
  return '';
}

/** Every proposer named anywhere inside a value: { proposedBy } on any record. */
function proposers(v, out = new Set()) {
  if (Array.isArray(v)) v.forEach(x => proposers(x, out));
  else if (isObj(v)) Object.entries(v).forEach(([k, x]) => { if (k === 'proposedBy' && typeof x === 'string' && x) out.add(x); else proposers(x, out); });
  return out;
}

/**
 * Checks a save. oldData: the stored engagement (null if none). newData: what the browser sent.
 * user: { id, email, name, roles[], isAdmin }. users: all users (for the people list).
 * Returns { error, status } or { data, newVersion } with the engagement to store.
 */
export function checkSave(oldData, newData, user, users) {
  if (!newData || typeof newData !== 'object' || newData.schema !== 'triodian.bd.v1') return { status: 400, error: 'Not an AI Board Direction engagement.' };
  const shape = structureError(newData);
  if (shape) return { status: 400, error: shape + ' Nothing was saved.' };
  const data = JSON.parse(JSON.stringify(newData));
  data.engagement.example = false;
  data.engagement.autosave = false;
  CLIENT_ONLY.forEach(k => { delete data[k]; });
  if (oldData) data.engagement.id = oldData.engagement.id;
  else if (typeof data.engagement.id !== 'string' || !IDRE.test(data.engagement.id)) return { status: 400, error: 'The engagement id is not valid.' };
  data.people = buildPeople(users);

  const refusals = [];
  const need = t => { const why = deny(t, user, oldData); if (why) refusals.push(why); };
  const roleOf = id => ((users.find(u => u.id === id) || {}).roles) || [];

  if (!oldData) {
    need('setup');
  } else {
    const o = oldData, n = data;
    // engagement details; the mode has its own rule (fixed once the inventory has a line)
    keysOf(o.engagement, n.engagement).forEach(k => {
      if (['id', 'example', 'autosave'].includes(k) || same(o.engagement[k], n.engagement[k])) return;
      need(k === 'mode' ? 'mode' : k === 'matterBrief' ? 'brief' : 'setup');
    });
    if (!same(o.areas, n.areas)) need('setup');
    // scope agreement (BP0.6), each in the person's own name
    const oa = o.scopeAgreed || {}, na = n.scopeAgreed || {};
    // anyone may withdraw an agreement they recorded themselves, even after the set-up changes who agrees
    const ownWithdraw = k => oa[k + 'By'] === user.id && !na[k + 'By'] && !na[k + 'On'];
    if (!same(oa.gcBy, na.gcBy) || !same(oa.gcOn, na.gcOn)) { if (!ownWithdraw('gc')) need('agreeGC'); if (na.gcBy && na.gcBy !== user.id) refusals.push('The GC’s agreement is recorded in your own name only.'); }
    if (!same(oa.chairBy, na.chairBy) || !same(oa.chairOn, na.chairOn)) { if (!ownWithdraw('chair')) need('agreeChair'); if (na.chairBy && na.chairBy !== user.id) refusals.push('The chair’s agreement is recorded in your own name only.'); }
    // the briefing record is kept by the server when a director completes the briefing (PUT /api/briefing)
    if (!same(o.education || {}, n.education || {})) refusals.push('The briefing record is kept by the app when a director completes the briefing.');
    // B1 inventory
    if (!same(o.inventory, n.inventory)) need('inventory');
    // B2 to B8: anyone may record only if allowed, and every newly named proposer must be one who may propose
    keysOf(o.positions, n.positions).forEach(step => {
      const a = (o.positions || {})[step], b = (n.positions || {})[step];
      if (same(a, b)) return;
      need('position');
      const before = proposers(a);
      proposers(b).forEach(id => { if (before.has(id)) return; const why = proposerError(roleOf(id), n); if (why) refusals.push(why); });
    });
    // questions to counsel
    const oQ = byKey(o.questions, 'ref'), nQ = byKey(n.questions, 'ref');
    keysOf(Object.fromEntries(oQ), Object.fromEntries(nQ)).forEach(ref => {
      const a = oQ.get(ref), b = nQ.get(ref);
      if (!a || !b) return need('ask');
      keysOf(a, b).forEach(k => {
        if (same(a[k], b[k])) return;
        if (['response', 'respondedOn', 'respondedBy'].includes(k) || (k === 'status' && b.status === 'answered')) return need('answer');
        need('ask');
      });
    });
    // B9 resolution, in the chair's own name
    if (!same(o.resolution, n.resolution)) {
      need('resolve');
      const by = (n.resolution || {}).by;
      if (by && by !== ((o.resolution || {}).by) && by !== user.id) refusals.push('The resolution is recorded in your own name only.');
    }
    // anything else at the top level is set-up
    keysOf(o, n).forEach(k => { if (!CLIENT_ONLY.includes(k) && !KNOWN.includes(k) && !same(o[k], n[k])) need('setup'); });
    // history is append only; new entries are signed by the server
    if (!isPrefix(o.history || [], n.history, ['by'])) return { status: 409, error: 'The change history does not match the saved engagement. Reload to get the latest version.' };
    n.history = (o.history || []).concat((n.history || []).slice((o.history || []).length));
  }

  if (refusals.length) return { status: 403, error: [...new Set(refusals)].slice(0, 3).join(' ') + ' Nothing was saved.' };
  const start = oldData ? (oldData.history || []).length : 0;
  data.history = (data.history || []).map((h, i) => (i >= start && isObj(h) ? { ...h, by: user.name || user.email } : h));
  data.previous = oldData ? (oldData.previous || null) : null;
  const newVersion = withVersions(oldData, data, user.name || user.email, new Date().toISOString());
  return { data, newVersion };
}

export { deny };
