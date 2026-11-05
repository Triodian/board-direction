/* AI Board Direction · Triodian
   The engagement shell: sign-in state, set-up, areas, people and the ten steps B0 to B9.
   The engagement is saved on the server (one per site) and every save is checked there against the signed-in
   person's roles, using the same rules this page reads (public/shared/rules.js).
   The step screens (B0 to B9), checks and outputs are added in development plan tasks 1.4 to 1.13. */
(function () {
'use strict';
const C = window.BD_CONTENT, RULES = window.BDRules;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nowISO = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 9);
const initials = s => String(s || '?').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join('');
const LOGO = h => `<img class="logo" src="/triodian-logo.svg" alt="Triodian" style="height:${h}px;width:auto;display:block">`;

const SRV = { checked: false, user: null, roles: [], site: '', code: '', reason: '', exists: false, rev: 0, state: 'saved', err: '' };
const UI = { acct: false, drawer: false };
let S = null, timer = null, saving = false, pending = false;

function toast(msg) { const t = document.getElementById('toast'); if (!t || !msg) return; t.textContent = msg; t.className = 'toast'; clearTimeout(toast._t); toast._t = setTimeout(() => { t.className = 'hidden'; }, 3800); }
async function api(method, path, body) {
  let r;
  try { r = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin', redirect: 'manual', cache: 'no-store' }); }
  catch (e) { return { ok: false, status: 0, error: 'The server could not be reached. Check your connection.' }; }
  if (r.type === 'opaqueredirect') return { ok: false, status: 401, error: 'Your sign-in has expired. Reload the page to sign in again.' };
  let j = null; try { j = await r.json(); } catch (e) {}
  if (r.status === 401) return { ok: false, status: 401, error: (j && j.error) || 'Your sign-in has expired. Reload the page to sign in again.' };
  if (!r.ok) return { ok: false, status: r.status, error: (j && j.error) || ('The server returned an error (' + r.status + ').'), code: j && j.code, body: j };
  return { ok: true, status: r.status, body: j };
}

/* ---------- permissions: the shared rules ---------- */
const me = () => SRV.user ? { id: SRV.user.id, roles: SRV.user.roles || [], isAdmin: !!SRV.user.isAdmin } : null;
const deny = t => { const p = me(); return p ? RULES.deny(t, p, S) : 'Sign in first.'; };
const roleName = id => (RULES.ROLES.find(r => r.id === id) || {}).name || id;

/* ---------- the engagement ---------- */
function blank() {
  return {
    schema: 'triodian.bd.v1',
    engagement: { id: 'e' + uid(), company: '', entityType: '', jurisdiction: 'AU', mode: 'standalone', reference: '', privilegeMarking: '', practitioner: { firm: '', line: '' }, boardDates: { workshop: '', resolution: '' }, gcActsAsCounsel: false, secondApproverId: '' },
    areas: C.startingAreas.map((name, i) => ({ id: 'A' + (i + 1), name })),
    scopeAgreed: { gcBy: '', gcOn: '', chairBy: '', chairOn: '' },
    inventory: [], positions: {}, questions: [], resolution: {}, people: [], versions: [], previous: null,
    history: [{ at: nowISO(), by: '', action: 'create', target: 'engagement', from: null, to: 'started' }],
  };
}
function log(action, target, from, to) { S.history.push({ at: nowISO(), by: '', action, target, from: from === undefined ? null : from, to: to === undefined ? null : to }); queueSave(); }
const TARGET = path => path === 'engagement.mode' ? 'mode' : 'setup';
function setPath(path, v) {
  const why = deny(TARGET(path)); if (why) { toast(why); render(); return; }
  const ks = path.split('.'), last = ks.pop(); let o = S; ks.forEach(k => { if (o[k] == null) o[k] = {}; o = o[k]; });
  const from = o[last]; if (from === v) return; o[last] = v;
  log('edit', path, typeof from === 'object' ? null : from, v);
}

/* ---------- saving ---------- */
function queueSave() { SRV.state = 'unsaved'; paintSave(); clearTimeout(timer); timer = setTimeout(save, 700); }
async function save() {
  if (saving) { pending = true; return; }
  saving = true; SRV.state = 'saving'; paintSave();
  const r = await api('PUT', '/api/engagement', { revision: SRV.rev, data: S });
  saving = false;
  if (r.ok) {
    SRV.rev = r.body.revision; SRV.exists = true; SRV.state = 'saved';
    if (r.body.merged && r.body.data) { S = r.body.data; render(); toast('Merged with changes saved by ' + r.body.mergedWith + '.'); }
    else if (r.body.versions) S.versions = r.body.versions;
  } else {
    SRV.state = 'error'; SRV.err = r.error; toast(r.error);
    if (r.status === 403 || r.status === 409) await load();
  }
  paintSave();
  if (pending) { pending = false; save(); }
}
async function load() {
  const r = await api('GET', '/api/engagement');
  if (!r.ok) { toast('Could not load the engagement: ' + r.error); return; }
  SRV.exists = !!r.body.exists; SRV.rev = r.body.revision || 0; SRV.state = 'saved';
  S = r.body.exists ? r.body.data : null;
  if (S && !S.people) S.people = r.body.people || [];
  render();
}
const SAVE = { saved: ['b-green', 'Saved'], unsaved: ['b-grey', 'Unsaved'], saving: ['b-grey', 'Saving…'], error: ['b-red', 'Not saved'] };
const saveChip = () => S ? `<span class="badge ${SAVE[SRV.state][0]}" id="savechip" title="${esc(SRV.err || '')}">${SAVE[SRV.state][1]}</span>` : '';
function paintSave() { const el = document.getElementById('savechip'); if (el) el.outerHTML = saveChip(); }

/* ---------- shell ---------- */
function header() {
  const u = SRV.user, roles = u ? (u.roles || []).map(roleName).join(', ') : '';
  const e = S ? S.engagement : null;
  const priv = e ? (String(e.privilegeMarking || '').trim() ? `<span class="priv">${esc(e.privilegeMarking)}</span>` : '<span class="priv none">No privilege marking set. Counsel directs the marking.</span>') : '';
  return `<header class="hdr"><div class="hdr-in">
    <a class="brand" href="/" aria-label="Triodian · AI Board Direction" style="text-decoration:none">${LOGO(22)}</a>
    <span class="vrule" aria-hidden="true"></span><span class="apptitle">Board Direction</span>
    <div class="hdr-r">${saveChip()}${u ? `<span class="acct"><button class="avatar-link" data-act="acct" aria-haspopup="menu" aria-expanded="${UI.acct}" aria-label="Account: ${esc(u.name || u.email)}"><span class="avatar" aria-hidden="true">${esc(initials(u.name || u.email))}</span></button>${UI.acct ? `<div class="acct-menu" role="menu">
      <div class="acct-who"><span class="avatar" aria-hidden="true">${esc(initials(u.name || u.email))}</span><div><strong>${esc(u.name || u.email)}</strong><div class="small soft">${esc(roles || 'No role in this engagement')}${u.isAdmin ? ' · administrator' : ''}</div></div></div>
      <a role="menuitem" class="item" href="/profile/">Your profile</a>${u.isAdmin ? '<a role="menuitem" class="item" href="/admin/">Admin · users and activity</a>' : ''}<a role="menuitem" class="item" href="/user-guide/">User guide</a><a role="menuitem" class="item signout" href="/auth/logout">Sign out</a></div>` : ''}</span>` : ''}<button class="iconbtn" data-act="drawer" aria-label="Menu" aria-expanded="${UI.drawer}">☰</button></div>
  </div>${e ? `<div class="docband"><div class="docband-in">${priv}<span class="stat"><strong>${esc(e.company || '[company not set]')}</strong> · ${esc((C.modes.find(m => m.id === e.mode) || {}).name || '')} mode</span></div></div>` : ''}</header>
  ${SRV.site ? `<div class="examplebar" style="background:#FDF0E1;color:#8A4B08;border-color:#F0D2AE">${esc(SRV.site)}: a test site for trying things out, not the live engagement</div>` : ''}`;
}
/* The menu: account links and the five Triodian apps, in the order of the suite. */
const appUrl = h => 'https://' + h + (SRV.site ? '-test' : '') + '.triodian.com/?suite=1';
function drawer() {
  if (!UI.drawer) return '';
  const u = SRV.user, app = (h, ic, bg, fg, name, desc) => `<a class="item" href="${appUrl(h)}" style="text-decoration:none"><span class="appic" style="background:${bg};color:${fg}">${ic}</span><span>${name}<br><span class="small soft">${desc}</span></span></a>`;
  return `<div class="drawer-bg" data-act="drawer"></div><aside class="drawer" role="dialog" aria-label="Menu">
    <div class="row between"><strong>Menu</strong><button class="iconbtn" data-act="drawer" aria-label="Close menu">✕</button></div>
    <div class="grp">Account</div>
    ${u ? `<p class="small soft" style="padding:0 10px">Signed in as ${esc(u.email)}</p><a class="item" href="/profile/" style="text-decoration:none">Your profile</a>${u.isAdmin ? '<a class="item" href="/admin/" style="text-decoration:none">Admin · users and activity</a>' : ''}` : ''}
    <a class="item" href="/user-guide/" style="text-decoration:none">User guide</a>
    <a class="item" href="/auth/logout" style="text-decoration:none">Sign out</a>
    <div class="grp">Apps</div>
    ${app('obligations-atlas', 'OA', '#E3E9EF', 'var(--navy)', 'AI Obligations Atlas', 'Obligations by jurisdiction, tier and use case')}
    <div class="item" aria-current="page"><span class="appic" style="background:var(--green-bg);color:var(--green)">BD</span><span>AI Board Direction<br><span class="small soft">Board steps B0 to B9: directions for the appetite, or the whole appetite for an unregulated company</span></span><span class="badge b-green" style="margin-left:auto">now</span></div>
    ${app('risk-appetite', 'RA', 'var(--aubergine-bg)', 'var(--aubergine)', 'AI Risk Appetite', 'Board positions and calibration set')}
    ${app('use-assessment', 'UA', '#E3E9EF', 'var(--navy)', 'AI Use Assessment', 'Register, tests and findings')}
    ${app('confidentiality', 'CE', '#F1E6DD', '#8A5A3B', 'AI Confidentiality Exposure Assessment', 'For unregulated entities: where deal information can reach an external AI model, for one transaction')}
  </aside>`;
}
const footer = () => `<footer class="ft"><div class="wrap"><div class="scope" role="note"><span aria-hidden="true">⚠</span><span><strong>Scope.</strong> ${esc(C.banner)}</span></div>
  <div class="ftrow"><span class="row" style="gap:12px">${LOGO(20)}<span class="mono soft">Framework ${esc(C.frameworkDate)}</span></span><span class="row"><a class="lnk" href="/user-guide/">User guide</a></span></div></div></footer>`;
const opening = (eb, h1, sub) => `<div class="opening"><div class="eyebrow">${eb}</div><h1 class="h1">${h1}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`;
function fld(label, path, value, o) {
  o = o || {}; const id = 'f_' + path.replace(/[^a-zA-Z0-9]/g, '_'), why = deny(TARGET(path)), dis = why ? `disabled title="${esc(why)}"` : '';
  const ctl = o.select ? `<select class="in" id="${id}" data-path="${esc(path)}" ${dis}>${o.select.map(x => `<option value="${esc(x[0])}" ${String(value) === String(x[0]) ? 'selected' : ''}>${esc(x[1])}</option>`).join('')}</select>`
    : `<input class="in" id="${id}" data-path="${esc(path)}" type="${o.type || 'text'}" value="${esc(value)}" placeholder="${esc(o.ph || '')}" ${dis}>`;
  return `<label class="f" for="${id}"><span>${esc(label)}</span>${ctl}</label>`;
}

/* ---------- screens ---------- */
function entryScreen() {
  if (!SRV.checked) return '<p class="soft">Connecting…</p>';
  if (!SRV.user) return `${opening('AI Board Direction', 'No access yet', '')}<div class="panel2" role="status" style="padding:12px 14px">${esc(SRV.reason || 'You have not been given access to this app.')} <a href="/auth/logout">Sign out</a></div>`;
  const can = !RULES.deny('setup', me(), null);
  return `${opening('AI Board Direction', 'No engagement yet', 'This site holds one board engagement. It has not been started.')}
    <div class="panel2" style="padding:14px 16px">${can ? '<p>Start the engagement, then complete set-up: the company, the mode, the areas of the business and the board dates.</p><button class="btn primary" data-act="new">Start the engagement</button>' : '<p class="soft">Triodian or an administrator starts the engagement.</p>'}</div>`;
}
function mainScreen() {
  const e = S.engagement, locked = !!RULES.deny('mode', me(), S) && RULES.modeLocked(S);
  const why = deny('setup'), whyNote = why ? `<p class="small soft" style="margin:6px 0">${esc(why)}</p>` : '';
  const people = (S.people || []).length ? S.people.map(p => `<div class="panel2" style="padding:10px 14px"><strong>${esc(p.name)}</strong>${p.organisation ? ` <span class="soft">· ${esc(p.organisation)}</span>` : ''}<div class="small soft">${esc(p.roles.map(roleName).join(', '))}</div></div>`).join('') : '<p class="small soft">No one has a role yet.</p>';
  const areas = S.areas.map((a, i) => `<div class="row" style="gap:8px"><input class="in" data-area="${i}" value="${esc(a.name)}" aria-label="Area ${i + 1}" ${why ? 'disabled' : ''}>${why ? '' : `<button class="btn sm ghost" data-act="delArea" data-i="${i}" aria-label="Remove ${esc(a.name)}">Remove</button>`}</div>`).join('');
  const steps = C.steps.map(s => `<div class="panel2"><div class="row between"><strong><span class="stepid">${s.id}</span>${esc(s.name)}</strong><span class="badge b-grey">Screen to come · task ${esc(s.task)}</span></div><p style="margin:6px 0 2px">${esc(s.question)}</p><p class="small soft" style="margin:0">Answered as: ${esc(s.answeredAs)}${e.mode === 'connected' && s.direction ? ` · Connected: ${esc(s.direction)}` : ''}</p></div>`).join('');
  return `${opening('AI Board Direction', esc(e.company || 'New engagement'), 'Set-up comes first. The ten steps follow, worked through in the workshop and resolved at the next board meeting.')}
  <section class="card"><h2 class="sh">1 · Engagement</h2>${whyNote}<div class="fgrid">
    ${fld('Company', 'engagement.company', e.company)}
    ${fld('Entity type', 'engagement.entityType', e.entityType, { select: [['', 'Choose…'], ...C.entityTypes] })}
    ${fld('Jurisdiction', 'engagement.jurisdiction', e.jurisdiction, { select: C.jurisdictions })}
    ${fld('Engagement reference', 'engagement.reference', e.reference)}
    ${fld('Privilege marking (as counsel directs)', 'engagement.privilegeMarking', e.privilegeMarking)}
    ${fld('Workshop date', 'engagement.boardDates.workshop', (e.boardDates || {}).workshop, { type: 'date' })}
    ${fld('Resolution meeting date', 'engagement.boardDates.resolution', (e.boardDates || {}).resolution, { type: 'date' })}
  </div></section>
  <section class="card"><h2 class="sh">2 · Mode</h2>
    <div class="fgrid">${fld('Mode', 'engagement.mode', e.mode, { select: C.modes.map(m => [m.id, m.name]) })}</div>
    <p class="small soft" style="margin:6px 0 0">${esc((C.modes.find(m => m.id === e.mode) || {}).for || '')}${locked ? ' The mode is fixed now the AI inventory has a line.' : ' The mode is fixed once the AI inventory (B1) has a line.'}</p></section>
  <section class="card"><h2 class="sh">3 · Practitioner</h2><p class="small soft" style="margin:0 0 8px">The firm whose name appears on the outputs beside the privilege marking.</p><div class="fgrid">
    ${fld('Firm', 'engagement.practitioner.firm', (e.practitioner || {}).firm)}
    ${fld('Line under the name', 'engagement.practitioner.line', (e.practitioner || {}).line, { ph: 'Prepared by [firm] using the Triodian method' })}
  </div></section>
  <section class="card"><div class="row between"><h2 class="sh" style="margin:0">4 · Areas of the business</h2>${why ? '' : '<button class="btn sm" data-act="addArea">Add an area</button>'}</div><p class="small soft">The board sets a posture for each area at B2. Change these to the company's own list.</p><div class="stack" style="gap:8px">${areas}</div></section>
  <section class="card"><div class="row between"><h2 class="sh" style="margin:0">5 · People</h2>${SRV.user && SRV.user.isAdmin ? '<a class="btn sm" href="/admin/">Manage in Admin</a>' : ''}</div><p class="small soft">Everyone with a role in this engagement. Roles are given in Admin.</p><div class="stack" style="gap:8px">${people}</div></section>
  <section class="card"><h2 class="sh">6 · The ten steps</h2><p class="small soft">From the Board AI Appetite Framework, section 4.1. Each step's screen is added in phase 1 of the development plan.</p><div class="steplist">${steps}</div></section>`;
}
function render() {
  const app = document.getElementById('app');
  app.innerHTML = header() + `<main id="main" tabindex="-1"><div class="wrap">${S ? mainScreen() : entryScreen()}</div></main>` + footer() + drawer();
}

/* ---------- events ---------- */
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.path) setPath(t.dataset.path, t.value);
  else if (t.dataset.area != null) { if (deny('setup')) return; const a = S.areas[+t.dataset.area], v = t.value.trim(); if (!a || a.name === v) return; const from = a.name; a.name = v; log('edit', 'areas.' + a.id, from, v); }
});
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && UI.drawer) { UI.drawer = false; render(); } });
document.addEventListener('click', async ev => {
  const b = ev.target.closest('[data-act]');
  if (!b) { if (UI.acct && !ev.target.closest('.acct')) { UI.acct = false; render(); } return; }
  const act = b.dataset.act;
  if (act === 'acct') { UI.acct = !UI.acct; UI.drawer = false; render(); }
  if (act === 'drawer') { UI.drawer = !UI.drawer; UI.acct = false; render(); }
  if (act === 'new') { S = blank(); SRV.rev = 0; render(); await save(); if (SRV.exists) await load(); }
  if (act === 'addArea') { const n = S.areas.reduce((m, a) => Math.max(m, +String(a.id).replace(/\D/g, '') || 0), 0) + 1; S.areas.push({ id: 'A' + n, name: 'New area' }); log('add', 'areas.A' + n, null, 'New area'); render(); }
  if (act === 'delArea') { const a = S.areas.splice(+b.dataset.i, 1)[0]; if (a) log('remove', 'areas.' + a.id, a.name, null); render(); }
});

/* ---------- boot ---------- */
(async function boot() {
  render();
  const r = await api('GET', '/api/me');
  SRV.checked = true;
  if (!r.ok) { SRV.reason = r.error; render(); return; }
  SRV.user = r.body.user; SRV.site = r.body.site || '';
  await load();
})();
window.BDApp = { state: () => S, render };
})();
