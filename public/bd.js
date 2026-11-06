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
const UI = { acct: false, drawer: false, practice: false };
let REAL = null; // the saved engagement, put aside while the worked example is open
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

/* The worked example opens by default. Leaving it is remembered for this browser session, so a reload stays out.
   A link to My actions (from an email) opens the real engagement. Same in all Triodian apps. */
const EX_LEFT = 'triodian.example.left';
const exampleLeft = () => { try { return sessionStorage.getItem(EX_LEFT) === '1'; } catch (e) { return false; } };
const markExampleLeft = left => { try { if (left) sessionStorage.setItem(EX_LEFT, '1'); else sessionStorage.removeItem(EX_LEFT); } catch (e) {} };
const openExampleByDefault = () => !exampleLeft() && location.hash !== '#actions';
/* Opens the worked example: a fictional company, board and advisers, never saved. */
function openExample() { if (!UI.practice) REAL = { S, rev: SRV.rev, exists: SRV.exists }; S = window.BDExample(); UI.practice = true; UI.drawer = false; UI.open = {}; UI.editLine = ""; UI.confirmDel = ""; render(); }
/* ---------- saving ---------- */
function queueSave() { if (UI.practice) return; SRV.state = 'unsaved'; paintSave(); clearTimeout(timer); timer = setTimeout(save, 700); }
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
const saveChip = () => S && !UI.practice ? `<span class="badge ${SAVE[SRV.state][0]}" id="savechip" title="${esc(SRV.err || '')}">${SAVE[SRV.state][1]}</span>` : '';
function paintSave() { const el = document.getElementById('savechip'); if (el) el.outerHTML = saveChip(); }

/* ---------- shell ---------- */
function header() {
  const u = SRV.user, roles = u ? (u.roles || []).map(roleName).join(', ') : '';
  const e = S ? S.engagement : null;
  const priv = e ? (String(e.privilegeMarking || '').trim() ? `<span class="priv">${esc(e.privilegeMarking)}</span>` : '<span class="priv none">No privilege marking set. Counsel directs the marking.</span>') : '';
  return `<header class="hdr"><div class="hdr-in">
    <a class="brand" href="/" aria-label="Triodian · AI Board Direction" style="text-decoration:none">${LOGO(22)}</a>
    <span class="vrule" aria-hidden="true"></span><span class="apptitle">AI Board Direction</span>
    <div class="hdr-r">${saveChip()}${u ? `<span class="acct"><button class="avatar-link" data-act="acct" aria-haspopup="menu" aria-expanded="${UI.acct}" aria-label="Account: ${esc(u.name || u.email)}"><span class="avatar" aria-hidden="true">${esc(initials(u.name || u.email))}</span></button>${UI.acct ? `<div class="acct-menu" role="menu">
      <div class="acct-who"><span class="avatar" aria-hidden="true">${esc(initials(u.name || u.email))}</span><div><strong>${esc(u.name || u.email)}</strong><div class="small soft">${esc(roles || 'No role in this engagement')}${u.isAdmin ? ' · administrator' : ''}</div></div></div>
      <a role="menuitem" class="item" href="/profile/">Your profile</a>${u.isAdmin ? '<a role="menuitem" class="item" href="/admin/">Admin · users and activity</a>' : ''}<a role="menuitem" class="item" href="/user-guide/">User guide</a><a role="menuitem" class="item signout" href="/auth/logout">Sign out</a></div>` : ''}</span>` : ''}<button class="iconbtn" data-act="drawer" aria-label="Menu" aria-expanded="${UI.drawer}">☰</button></div>
  </div>${e ? `<div class="docband"><div class="docband-in"><span style="display:inline-flex;align-items:center;gap:14px;flex-wrap:wrap">${priv}${TriodianBrand.chip(e.practitioner)}</span><span class="stat"><strong>${esc(e.company || '[company not set]')}</strong> · ${esc((C.modes.find(m => m.id === e.mode) || {}).name || '')} mode</span></div></div>` : ''}</header>
  ${SRV.site ? `<div class="examplebar" style="background:#FDF0E1;color:#8A4B08;border-color:#F0D2AE">${esc(SRV.site)}: a test site for trying things out, not the live engagement</div>` : ''}
  ${UI.practice ? '<div class="examplebar">Worked example: a fictional company, board and advisers, for practice only. Nothing is saved. <button class="lnk" data-act="leaveExample">Leave the worked example</button></div>' : ''}`;
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
    <div class="grp">Practice</div>
    ${UI.practice ? '<button class="item" data-act="leaveExample">Leave the worked example</button>' : '<button class="item" data-act="example">Open the worked example</button>'}
    <p class="small soft" style="padding:0 10px">The worked example is fictional and runs in this browser only. Nothing in it is saved.</p>
    <div class="grp">Apps</div>
    ${app('obligations-atlas', 'OA', '#E3E9EF', 'var(--navy)', 'AI Obligations Atlas', 'Obligations by jurisdiction, tier and use case')}
    <div class="item" aria-current="page"><span class="appic" style="background:var(--green-bg);color:var(--green)">BD</span><span>AI Board Direction<br><span class="small soft">The board’s direction on AI: where to use it and what to rule out</span></span><span class="badge b-green" style="margin-left:auto">now</span></div>
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


/* ---------- the ten steps: what each one holds ---------- */
const SC = C.scales;
const lbl = (list, code) => { const x = list.find(r => r[0] === code); return x ? x[1] : (code || ''); };
const pname = id => ((S.people || []).find(p => p.id === id) || {}).name || id || '';
const areaName = id => (S.areas.find(a => a.id === id) || {}).name || id;
const table = (head, rows) => rows.length ? `<div class="tw" style="margin:8px 0"><table class="lg"><thead><tr>${head.map(h => `<th>${typeof h === 'object' ? h.html : esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
/* Hover tips: any element with data-tip shows a plain-language explanation on hover, keyboard focus or tap. */
const tip = (html, text, cls) => text ? `<span class="${cls ? cls + ' ' : ''}tip" tabindex="0" data-tip="${esc(text)}">${html}</span>` : html;
const refTip = id => { const k = (/^[A-Z]+/.exec(id || '') || [''])[0]; return tip(`<span class="mono">${esc(id)}</span>`, (C.tips.ref || {})[k] ? id + ' · ' + C.tips.ref[k] : ''); };
const classTip = g => tip(`${esc(g)} ${esc(lbl(SC.infoClass, g))}`, (C.tips.infoClass || {})[g]);
const kindTip = k => tip(esc(lbl(SC.toolKind, k)), (C.tips.toolKind || {})[k]);
const authTip = a => tip(`${esc(a)} ${esc(lbl(SC.authority, a))}`, ((SC.authority.find(r => r[0] === a) || [])[2] || '') && `${a} ${lbl(SC.authority, a)}: ${(SC.authority.find(r => r[0] === a) || [])[2]}.`);
const by = id => id ? `<span class="small soft">${esc(pname(id))}</span>` : '';
const dis = x => x && x.dissent ? `<br><span class="small">Dissent: ${esc(x.dissent)}</span>` : '';
const pos = k => (S.positions || {})[k] || {};
const dl = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? new Date(v + 'T12:00:00Z').toLocaleDateString('en-AU', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }) : (v || '');
/* Highest authority a posture accepts (framework sections 2.3 and 4.2): Avoid A1, Cautious A2, Open A4, Pursue A6. */
const POSTURE_MAX = { S1: 1, S2: 2, S3: 4, S4: 6 };
/* The reality note (framework 10.1): inventory lines that already cross a position. Each becomes a 90-day action. */
function reality() {
  const out = [], b2 = pos('B2'), cells = pos('B5').cells || {};
  (S.inventory || []).forEach(l => {
    const p = (b2[l.area] || {}).posture, n = +String(l.authority || '').slice(1);
    if (p && n > POSTURE_MAX[p]) out.push([l, `${l.authority} ${lbl(SC.authority, l.authority)} is above what ${lbl(SC.posture, p)} accepts in ${areaName(l.area)}`]);
    if (cells[l.info + ':' + l.kind] === 'N') out.push([l, `${l.info} ${lbl(SC.infoClass, l.info)} through ${lbl(SC.toolKind, l.kind)} is marked not permitted`]);
  });
  return out;
}
/* ---------- B1: the AI inventory (framework section 5.2) and the automated-decision worklist (BO5, section 8.5) ----------
   The CEO and Triodian add and edit lines. In the worked example anyone can try it; nothing is saved.
   Marking a line as making decisions about individuals (field 8) raises a question to counsel and puts the line
   on the worklist. Field 8 records the fact only: whether the Privacy Act requirement is engaged is counsel's call. */
const INV_REQUIRED = [['use', 'use'], ['tool', 'tool'], ['area', 'area'], ['who', 'who uses it'], ['authority', 'authority'], ['info', 'information'], ['kind', 'tool kind'], ['owner', 'owner'], ['source', 'source']];
const invWhy = () => UI.practice ? '' : deny('inventory');
const todayISO = () => new Date().toLocaleDateString('en-CA');
const myId = () => UI.practice ? 'p-rec' : (SRV.user || {}).id || '';
const myName = () => UI.practice ? 'Lee Chan' : ((SRV.user || {}).name || (SRV.user || {}).email || '');
const missing = l => INV_REQUIRED.filter(([k]) => !String(l[k] || '').trim()).map(x => x[1]);
const lineQuestion = l => (S.questions || []).find(q => (q.lines || []).includes(l.id));
const admLines = () => (S.inventory || []).filter(l => l.adm);
const qBadge = q => q ? `${refTip(q.ref)} ${q.status === 'answered' ? '<span class="badge b-green">Answered</span>' : '<span class="badge b-ochre">Open</span>'}` : '<span class="soft">None yet</span>';
function invForm(l) {
  const fid = k => `inv_${l.id}_${k}`;
  const f = (k, label, ctl, help) => `<label class="f" for="${fid(k)}"><span>${label}</span>${ctl}${help ? `<span class="small soft" style="font-weight:400">${help}</span>` : ''}</label>`;
  const inp = (k, label, ph, help) => f(k, label, `<input class="in" id="${fid(k)}" data-inv="${l.id}" data-k="${k}" value="${esc(l[k] || '')}" placeholder="${esc(ph || '')}"${k === 'who' ? ' list="inv_who"' : ''}>`, help);
  const sel = (k, label, opts, help) => f(k, label, `<select class="in" id="${fid(k)}" data-inv="${l.id}" data-k="${k}">${[['', 'Choose…'], ...opts].map(o => `<option value="${esc(o[0])}" ${String(l[k] || '') === String(o[0]) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`, help);
  const people = (S.people || []).filter(p => p.active !== false).map(p => [p.id, p.name]);
  const q = lineQuestion(l), del = UI.confirmDel === l.id;
  return `<div class="panel2" id="invedit" style="padding:14px 16px;margin:10px 0"><div class="row between"><strong>Line ${esc(l.id)}</strong><span class="small soft">Fields 1 to 10 of framework section 5.2</span></div>
    <div class="fgrid" style="margin-top:8px">
      ${inp('use', '1 · Use', 'What it does, in one line')}
      ${inp('tool', '2 · Tool and provider', 'Name, or “a provider’s own AI”')}
      ${sel('area', '3 · Area', S.areas.map(a => [a.id, a.name]))}
      ${inp('who', '4 · Who uses it', 'Staff, a provider for us, customers directly')}
      ${sel('authority', '5 · Authority', SC.authority.map(r => [r[0], `${r[0]} ${r[1]}: ${r[2]}`]))}
      ${sel('info', '6 · Information it sees (highest class)', SC.infoClass.map(r => [r[0], `${r[0]} ${r[1]}`]))}
      ${sel('kind', '7 · Tool kind', SC.toolKind.map(r => [r[0], `${r[0]} ${r[1]}`]))}
      ${sel('owner', '9 · Owner', people, people.length ? '' : 'No one has a role yet. Roles are given in Admin.')}
      ${inp('source', '10 · Source', 'Who said so, and when')}
    </div>
    <datalist id="inv_who"><option value="Staff"><option value="A provider for us"><option value="Customers directly"></datalist>
    <div style="margin-top:12px"><label style="display:flex;flex-wrap:nowrap;gap:10px;align-items:flex-start;cursor:pointer" for="${fid('adm')}"><input type="checkbox" id="${fid('adm')}" data-inv="${l.id}" data-k="adm" ${l.adm ? 'checked' : ''} style="margin-top:4px;flex:0 0 auto;width:16px;height:16px"><span style="flex:1 1 auto"><strong>8 · Decisions about individuals.</strong> This use makes, or substantially contributes to, a decision about a person using their personal information.<br><span class="small soft">Records the fact only. A yes raises a question to counsel and puts the line on the automated-decision worklist. Counsel decides what it means for the privacy policy.</span></span></label></div>
    ${l.adm ? `<div class="fgrid" style="margin-top:8px">${inp('decisions', 'Kinds of decision', 'For example: which applicants go forward to interview')}${inp('personalInfo', 'Personal information it uses', 'By kind, for example: CVs, work history')}</div><p class="small" style="margin:6px 0 0">Question to counsel: ${qBadge(q)}</p>` : ''}
    <div class="row" style="gap:8px;margin-top:14px"><button class="btn primary sm" data-act="doneLine">Done</button><button class="btn sm ghost" data-act="delLine" data-id="${l.id}">${del ? 'Confirm: remove this line' : 'Remove this line'}</button>${del ? '<button class="btn sm ghost" data-act="keepLine">Keep it</button>' : ''}</div>
  </div>`;
}
function worklist() {
  const ls = admLines();
  if (!ls.length) return '';
  return `<div style="margin-top:16px"><div class="row between"><p class="mini" style="margin:0">${tip('Automated-decision worklist', 'BO5 · Every line marked yes in field 8, for the GC. A list of facts for counsel’s review of the privacy policy against APPs 1.7 to 1.9. It states no conclusion on what the policy must say.')} · for counsel</p><button class="btn sm" data-act="worklistDocx">Download as Word</button></div>`
    + table(['Line', 'Use', 'Area', 'Kinds of decision', 'Personal information used', 'Owner', 'Question to counsel'], ls.map(l => [refTip(l.id), esc(l.use), esc(areaName(l.area)), l.decisions ? esc(l.decisions) : '<span class="soft">Not recorded</span>', l.personalInfo ? esc(l.personalInfo) : '<span class="soft">Not recorded</span>', esc(pname(l.owner)), qBadge(lineQuestion(l))]))
    + '<p class="small soft">Field 8 records the fact only. Whether the requirement is engaged is counsel’s determination.</p></div>';
}
function inventoryBody() {
  const inv = S.inventory || [], why = invWhy(), can = !why;
  const head = ['Line', 'Use', 'Area', 'Authority', 'Sees', 'Tool kind', { html: tip('About individuals', C.tips.adm) }, 'Owner'];
  const rows = inv.map(l => { const m = missing(l); return [refTip(l.id) + (m.length ? `<br>${tip('Incomplete', 'Still to record: ' + m.join(', ') + '.', 'badge b-grey')}` : ''), esc(l.use || '') + `<br><span class="small soft">${[l.tool, l.who, l.source].filter(Boolean).map(esc).join(' · ')}</span>`, esc(l.area ? areaName(l.area) : ''), l.authority ? authTip(l.authority) : '', l.info ? classTip(l.info) : '', l.kind ? kindTip(l.kind) : '', l.adm ? '<span class="badge b-ochre">Yes · to counsel</span>' : 'No', esc(pname(l.owner))].concat(can ? [`<button class="btn sm ghost" data-act="editLine" data-id="${l.id}" aria-label="Edit line ${l.id}">${UI.editLine === l.id ? 'Editing' : 'Edit'}</button>`] : []); });
  const editing = can && inv.find(l => l.id === UI.editLine);
  const intro = !inv.length ? `<p class="small" style="margin:4px 0 8px">One line per AI use, 10 to 20 lines, supplied by the CEO or the people they nominate. Start with:</p><ul class="small" style="margin:0 0 8px 18px"><li>Which AI tools have we licensed, and which do staff use without a licence?</li><li>Which of our providers use AI in the work they do for us?</li></ul>${!UI.practice && !RULES.modeLocked(S) ? `<p class="small soft">The mode (${esc(lbl(C.modes.map(m => [m.id, m.name]), S.engagement.mode))}) is fixed once the first line is added.</p>` : ''}` : '';
  const n = inv.length, count = n ? `<p class="small soft" style="margin:4px 0">${n} line${n === 1 ? '' : 's'}${n < 10 ? ' · the framework expects 10 to 20' : n > 20 ? ' · more than the 20 the framework expects; consider grouping similar uses' : ''}</p>` : '';
  return intro + count + table(can ? head.concat(['']) : head, rows) + (editing ? invForm(editing) : '')
    + (can ? `<div class="row" style="gap:8px;margin:8px 0"><button class="btn sm" data-act="addLine">Add a line</button>${inv.length ? '<button class="btn sm ghost" data-act="inventoryCsv">Download as CSV</button>' : ''}${UI.practice ? '<span class="small soft">Worked example: try it. Nothing is saved.</span>' : ''}</div>` : (inv.length ? '<div class="row" style="margin:8px 0"><button class="btn sm ghost" data-act="inventoryCsv">Download as CSV</button></div>' : (!why ? '' : `<p class="small soft">${esc(why)}</p>`)))
    + worklist();
}
/* A question to counsel for a line marked yes in field 8, once per line. Returns its ref, or '' if one exists. */
function raiseADM(l) {
  if (lineQuestion(l)) return '';
  S.questions = S.questions || [];
  const ref = nextQRef();
  S.questions.push({ ref, step: 'B1', lines: [l.id], question: `Line ${l.id}${l.use ? ' (' + l.use + ')' : ''} is recorded as making, or substantially contributing to, decisions about individuals. Does the privacy policy need to describe it under APPs 1.7 to 1.9, which apply from 10 December 2026?`, status: 'open', response: '', sentOn: todayISO(), raisedBy: myId() });
  log('add', 'questions.' + ref, null, 'open');
  return ref;
}
function setInv(id, k, v) {
  const why = invWhy(); if (why) { toast(why); render(); return; }
  const l = (S.inventory || []).find(x => x.id === id); if (!l) return;
  const from = l[k]; if (from === v) return;
  l[k] = v; log('edit', `inventory.${id}.${k}`, from == null ? null : from, v);
  if (k === 'adm') {
    if (v) { const ref = raiseADM(l); toast(ref ? `${ref} raised to counsel on line ${id}. The line is on the worklist.` : `Line ${id} is back on the worklist. Its question to counsel is already raised.`); }
    else { const q = lineQuestion(l); toast(`Line ${id} is off the worklist.` + (q && q.status !== 'answered' ? ` ${q.ref} stays open for counsel to close.` : '')); }
  }
  rerender();
}
/* Redraw after a change without losing the place: keep the scroll position and the field the person moved to. */
function rerender() { setTimeout(() => { const a = document.activeElement, fid = a && a.id, y = scrollY; render(); scrollTo(0, y); if (fid) { const el = document.getElementById(fid); if (el) el.focus(); } }, 0); }
function worklistMarkdown() {
  const e = S.engagement, cell = v => String(v == null ? '' : v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const resolved = RULES.isResolved(S);
  const out = [];
  if (String(e.privilegeMarking || '').trim()) out.push(e.privilegeMarking.trim(), '');
  out.push('# Automated-decision worklist', '',
    `**${cell(e.company || '[company]')}**${e.reference ? ' · ' + cell(e.reference) : ''} · ${resolved ? 'As resolved' : 'Draft'}, ${dl(todayISO())}`, '');
  out.push('Every line of the AI inventory (B1) recorded as making, or substantially contributing to, a decision about an individual using their personal information. It is a list of facts for counsel’s review of the privacy policy against APPs 1.7 to 1.9, which apply from 10 December 2026. It states no conclusion on what the policy must say.', '',
    '| Line | Use | Area | Kinds of decision | Personal information used | Owner | Question to counsel |', '| --- | --- | --- | --- | --- | --- | --- |');
  admLines().forEach(l => { const q = lineQuestion(l); out.push(`| ${cell(l.id)} | ${cell(l.use)} | ${cell(l.area ? areaName(l.area) : '')} | ${cell(l.decisions || 'Not recorded')} | ${cell(l.personalInfo || 'Not recorded')} | ${cell(pname(l.owner))} | ${q ? cell(q.ref + ', ' + (q.status === 'answered' ? 'answered' : 'open')) : 'None yet'} |`); });
  const qs = admLines().map(lineQuestion).filter(Boolean).filter((q, i, a) => a.indexOf(q) === i);
  if (qs.length) { out.push('', '## Questions to counsel', ''); qs.forEach(q => out.push(`- **${cell(q.ref)}** (raised ${dl(q.sentOn)}). ${cell(q.question)}${q.response ? ' *Counsel’s answer:* ' + cell(q.response) : ' *Not yet answered.*'}`)); }
  out.push('', '## Sources', '');
  admLines().forEach(l => out.push(`- ${cell(l.id)}: ${cell(l.source || 'Not recorded')}`));
  return out.join('\n');
}
function saveBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
/* The inventory as CSV: one row per line, codes and their names, for the CEO's working list or a spreadsheet. */
function downloadInventoryCsv() {
  const q = v => { const t = String(v == null ? '' : v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  const head = ['Line', 'Use', 'Tool and provider', 'Area', 'Who uses it', 'Authority', 'Information it sees', 'Tool kind', 'Decisions about individuals', 'Kinds of decision', 'Personal information used', 'Owner', 'Source', 'Question to counsel'];
  const rows = (S.inventory || []).map(l => { const qq = lineQuestion(l); return [l.id, l.use, l.tool, l.area ? areaName(l.area) : '', l.who, l.authority ? l.authority + ' ' + lbl(SC.authority, l.authority) : '', l.info ? l.info + ' ' + lbl(SC.infoClass, l.info) : '', l.kind ? l.kind + ' ' + lbl(SC.toolKind, l.kind) : '', l.adm ? 'Yes' : 'No', l.adm ? l.decisions : '', l.adm ? l.personalInfo : '', pname(l.owner), l.source, qq ? qq.ref + ' (' + qq.status + ')' : '']; });
  const e = S.engagement, lines = [];
  if (String(e.privilegeMarking || '').trim()) lines.push(q(e.privilegeMarking.trim()));
  lines.push(head.map(q).join(','), ...rows.map(r => r.map(q).join(',')));
  saveBlob(new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), `AI inventory${e.company ? ' - ' + e.company.replace(/[\\/:*?"<>|]/g, '') : ''}.csv`);
  toast('CSV downloaded');
}
/* Your actions: what is waiting on the signed-in person. The GC answers questions to counsel here. */
function actionsPanel() {
  if (UI.practice || !SRV.user) return '';
  const u = me(), items = [];
  if (!RULES.deny('answer', u, S)) (S.questions || []).filter(q => q.status !== 'answered').forEach(q => {
    const v = (UI.answer || {})[q.ref] || '';
    items.push(`<div class="panel2" style="padding:12px 14px" id="act-${esc(q.ref)}"><div class="row between"><strong>${refTip(q.ref)} · question to counsel${q.step ? ' at ' + esc(q.step) : ''}</strong><span class="small soft">Raised ${esc(dl(q.sentOn))}${q.raisedBy ? ' by ' + esc(pname(q.raisedBy)) : ''}</span></div><p style="margin:6px 0">${esc(q.question)}</p>
      <label class="f" for="ans_${esc(q.ref)}"><span>Counsel’s answer</span><textarea class="in" id="ans_${esc(q.ref)}" data-ans="${esc(q.ref)}" rows="2">${esc(v)}</textarea></label>
      <div class="row" style="margin-top:8px"><button class="btn sm primary" data-act="answerQ" data-ref="${esc(q.ref)}">Record the answer</button></div></div>`);
  });
  if (!RULES.deny('inventory', u, S)) {
    const inc = (S.inventory || []).filter(l => missing(l).length);
    if (inc.length) items.push(`<div class="panel2" style="padding:12px 14px"><strong>AI inventory (B1): ${inc.length} line${inc.length === 1 ? '' : 's'} to complete</strong><p class="small" style="margin:6px 0 0">${inc.map(l => `${esc(l.id)}: ${esc(missing(l).join(', '))}`).join('<br>')}</p><div class="row" style="margin-top:8px"><button class="btn sm" data-act="goB1">Open the inventory</button></div></div>`);
  }
  return `<section class="card" id="actions"><h2 class="sh">Your actions</h2>${items.length ? `<div class="stack" style="gap:8px">${items.join('')}</div>` : '<p class="small soft" style="margin:0">Nothing is waiting on you.</p>'}</section>`;
}
function downloadWorklist() {
  if (!window.RAFExport) { toast('The Word export did not load. Reload the page and try again.'); return; }
  const e = S.engagement;
  toast('Preparing the Word document…');
  window.RAFExport.toDocx(worklistMarkdown(), { insurer: e.company, reference: e.reference, creator: 'Triodian AI Board Direction', brand: e.practitioner, wide: true }).then(blob => {
    saveBlob(blob, `Automated-decision worklist${e.company ? ' - ' + e.company.replace(/[\\/:*?"<>|]/g, '') : ''}.docx`); toast('Word document downloaded');
  }, err => toast('The Word document could not be made: ' + (err && err.message || err)));
}
/* ---------- B2 to B8: recording the board's positions (framework sections 5.3 to 6.4) ----------
   Positions are proposed by a director, the chair, the CEO or (connected) the CRO, and recorded by them or by Triodian.
   Each position carries who proposed it and any dissent. Every step has its prompts, its starting position and a
   box to log a question to counsel. In the worked example anyone can try them; nothing is saved. */
const posWhy = () => UI.practice ? '' : deny('position');
const askWhy = () => UI.practice ? '' : deny('ask');
function posObj(step) { S.positions = S.positions || {}; return (S.positions[step] = S.positions[step] || {}); }
/* A path inside positions[step]: dotted keys, where a list is entered by an item's id (lines.RL1.use). */
function walk(step, path, create) {
  const ks = path.split('.'), last = ks.pop(); let o = posObj(step);
  for (const k of ks) {
    let n = Array.isArray(o) ? o.find(x => x && x.id === k) : o[k];
    if (n == null) { if (!create || Array.isArray(o)) return null; n = o[k] = {}; }
    o = n;
  }
  return { o, last };
}
function setPos(step, path, v) {
  const why = posWhy(); if (why) { toast(why); render(); return; }
  const w = walk(step, path, true); if (!w) return;
  const from = w.o[w.last]; if ((from == null ? '' : from) === v) return;
  w.o[w.last] = v; log('edit', `positions.${step}.${path}`, from == null ? null : from, v);
  rerender();
}
const proposerOpts = () => (S.people || []).filter(p => p.active !== false && !RULES.proposerError(p.roles, S)).map(p => [p.id, p.name]);
const keepOpt = (opts, v) => v && !opts.some(o => o[0] === v) ? opts.concat([[v, v]]) : opts;
/* An input bound to a position. o: { select, blank, ph, list, rows, label } */
function pIn(step, path, v, o) {
  o = o || {};
  const a = `id="p_${step}_${path.replace(/[^A-Za-z0-9]/g, '_')}" data-pos="${step}" data-ppath="${esc(path)}" aria-label="${esc(o.label || '')}"`;
  if (o.select) return `<select class="in" ${a}>${[['', o.blank || '—'], ...keepOpt(o.select, v)].map(x => `<option value="${esc(x[0])}" ${String(v || '') === String(x[0]) ? 'selected' : ''}>${esc(x[1])}</option>`).join('')}</select>`;
  if (o.rows) return `<textarea class="in" rows="${o.rows}" ${a} placeholder="${esc(o.ph || '')}">${esc(v || '')}</textarea>`;
  return `<input class="in" ${a} value="${esc(v || '')}" placeholder="${esc(o.ph || '')}"${o.list ? ` list="${o.list}"` : ''}>`;
}
const propSel = (step, path, v) => pIn(step, path, v, { select: proposerOpts(), blank: 'Proposed by…', label: 'Proposed by' });
const dissentIn = (step, path, v) => pIn(step, path, v, { ph: 'Dissent, if any', label: 'Dissent' });
const delBtn = (step, list, id) => { const k = step + '.' + list + '.' + id, c = UI.confirmDel === k; return `<button class="btn sm ghost" data-act="delRow" data-step="${step}" data-list="${list}" data-id="${esc(id)}" aria-label="Remove ${esc(id)}">${c ? 'Confirm' : 'Remove'}</button>`; };
function addRow(step, list, prefix, init) {
  const P = posObj(step); P[list] = Array.isArray(P[list]) ? P[list] : [];
  const n = P[list].reduce((m, x) => Math.max(m, +String(x.id || '').replace(/\D/g, '') || 0), 0) + 1;
  const row = Object.assign({ id: prefix + n }, init || {});
  P[list].push(row); log('add', `positions.${step}.${list}.${row.id}`, null, 'added');
  return row;
}
/* B2's starting position (framework 5.3): the posture that matches the highest authority B1 records in the area. */
const POSTURE_FOR = { 1: 'S1', 2: 'S2', 3: 'S3', 4: 'S3', 5: 'S4', 6: 'S4' };
function startingPosture(areaId) {
  const ls = (S.inventory || []).filter(l => l.area === areaId && /^A\d$/.test(l.authority || ''));
  if (!ls.length) return null;
  const top = ls.reduce((m, l) => (+l.authority.slice(1) > +m.authority.slice(1) ? l : m));
  return { posture: POSTURE_FOR[+top.authority.slice(1)], line: top };
}
/* BK2 (framework 6.1): moving down a column of the B5 table, a marking may stay or tighten, never loosen. */
const STRICT = { P: 1, C: 2, N: 3 };
function loosened(cells) {
  const out = [];
  SC.toolKind.forEach(k => { let prev = null; SC.infoClass.forEach(g => { const m = cells[g[0] + ':' + k[0]]; if (!m) return; if (prev && STRICT[m] < STRICT[prev.m]) out.push({ g: g[0], k: k[0], above: prev.g }); prev = { m, g: g[0] }; }); });
  return out;
}
const sub = t => `<p class="mini" style="margin:14px 0 4px">${t}</p>`;
function stepAids(id) {
  const s = C.steps.find(x => x.id === id) || {};
  return (s.prompts ? `<details style="margin:4px 0 8px"><summary class="small" style="cursor:pointer">Prompts for the room</summary><ul class="small" style="margin:6px 0 0 18px">${s.prompts.map(p => `<li>${esc(p)}</li>`).join('')}</ul></details>` : '')
    + (s.start ? `<p class="small soft" style="margin:0 0 8px"><strong>Starting position.</strong> ${esc(s.start)} It is a place to begin, not a recommendation.</p>` : '');
}
function posEditor(id) {
  const P = (S.positions || {})[id] || {};
  let h = '';
  if (id === 'B2') {
    const goals = P.goals || [];
    h += sub(tip('Governance goals', 'What the board wants AI governance to achieve. Each goal has an owner and a measure, which B7 reports.') + ' · what AI governance should achieve');
    h += table(['Ref', 'Goal', 'Owner', 'Measure (reported at B7)', 'Proposed by', ''], goals.map(g => [refTip(g.id), pIn(id, `goals.${g.id}.goal`, g.goal, { rows: 3, label: 'Goal ' + g.id }), pIn(id, `goals.${g.id}.owner`, g.owner, { ph: 'Named person', label: 'Owner of ' + g.id }), pIn(id, `goals.${g.id}.measure`, g.measure, { rows: 3, ph: 'How the board will see progress', label: 'Measure for ' + g.id }), propSel(id, `goals.${g.id}.proposedBy`, g.proposedBy), delBtn(id, 'goals', g.id)]));
    h += `<div class="row" style="gap:8px;margin:6px 0"><button class="btn sm" data-act="addGoal">Add a goal</button>${goals.length ? '' : '<button class="btn sm ghost" data-act="toggleGoalIdeas">Goals boards often set</button>'}</div>`;
    if (UI.goalIdeas && !goals.length) h += `<div class="panel2" style="padding:10px 14px"><p class="small soft" style="margin:0 0 6px">Examples only. The board writes its own goals; including one here is not a recommendation.</p>${C.starting.goals.map((g, i) => `<div class="row between" style="gap:8px;margin:4px 0"><span class="small">${esc(g)}</span><button class="btn sm ghost" data-act="addGoal" data-i="${i}">Start from this</button></div>`).join('')}</div>`;
    h += sub('Posture by area');
    const postures = SC.posture.map(r => [r[0], `${r[0]} ${r[1]}`]).concat([['NS', 'Not set']]);
    h += table(['Area', { html: tip('Starting position', 'The posture that matches the highest authority the inventory (B1) records in the area. Confirm or change it.') }, 'Posture', 'Condition', 'Proposed by', 'Dissent'], S.areas.map(a => {
      const x = P[a.id] || {}, st = startingPosture(a.id);
      const start = st ? `${esc(lbl(SC.posture, st.posture))}<br><span class="small soft">from ${esc(st.line.id)} at ${esc(st.line.authority)}</span>${x.posture !== st.posture ? `<br><button class="lnk small" data-act="usePosture" data-area="${a.id}" data-v="${st.posture}">Use this</button>` : ''}` : '<span class="small soft">No inventory line</span>';
      const ns = x.posture === 'NS' ? `<div class="stack" style="gap:4px;margin-top:4px">${pIn(id, `${a.id}.notSetOwner`, x.notSetOwner, { ph: 'Who will set it', label: 'Who will set the posture for ' + a.name })}${pIn(id, `${a.id}.notSetBy`, x.notSetBy, { ph: 'By when', label: 'By when' })}</div>` : '';
      return [esc(a.name), start, pIn(id, `${a.id}.posture`, x.posture, { select: postures, blank: 'Choose…', label: 'Posture for ' + a.name }) + ns, pIn(id, `${a.id}.condition`, x.condition, { ph: 'Any condition', label: 'Condition for ' + a.name }), propSel(id, `${a.id}.proposedBy`, x.proposedBy), dissentIn(id, `${a.id}.dissent`, x.dissent)];
    }));
    const over = S.areas.filter(a => { const p = (P[a.id] || {}).posture, st = startingPosture(a.id); return p && p !== 'NS' && st && +String(st.line.authority).slice(1) > POSTURE_MAX[p]; });
    if (over.length) h += `<p class="small" style="margin:4px 0">${tip('Reality note', C.tips.reality)}: the inventory already goes beyond the posture in ${over.map(a => esc(a.name)).join(', ')}. That is not a failure; it becomes an action on the 90-day list.</p>`;
  } else if (id === 'B3') {
    const lines = P.lines || [], scopes = [['All areas', 'All areas'], ...S.areas.map(a => [a.name, a.name])];
    const applies = ['The company', 'Its providers', 'The company and its providers', 'The company and its advisers', 'The company, its providers and its advisers'].map(x => [x, x]);
    h += table(['Ref', 'Red line: the use not accepted', 'Scope', 'Applies to', 'Proposed by', 'Dissent', ''], lines.map(x => [refTip(x.id), pIn(id, `lines.${x.id}.use`, x.use, { rows: 2, ph: 'A use someone reading an inventory line can test', label: 'Red line ' + x.id }), pIn(id, `lines.${x.id}.scope`, x.scope, { select: scopes, blank: 'Choose…', label: 'Scope of ' + x.id }), pIn(id, `lines.${x.id}.appliesTo`, x.appliesTo, { select: applies, blank: 'Choose…', label: x.id + ' applies to' }), propSel(id, `lines.${x.id}.proposedBy`, x.proposedBy), dissentIn(id, `lines.${x.id}.dissent`, x.dissent), delBtn(id, 'lines', x.id)]));
    h += `<p class="small soft" style="margin:4px 0">Each red line must be testable: someone reading an inventory line must be able to say whether it crosses it.</p><div class="row" style="gap:8px;margin:6px 0"><button class="btn sm" data-act="addRedLine">Add a red line</button><button class="btn sm ghost" data-act="toggleCand">${UI.cand ? 'Hide' : 'Show'} the uses boards commonly consider</button></div>`;
    if (UI.cand) h += `<div class="panel2" style="padding:10px 14px"><p class="small soft" style="margin:0 0 6px">Shown because the board asked. The board may adopt none, some or all; inclusion is not a recommendation.</p>${C.starting.redLineCandidates.map((c, i) => { const has = lines.some(l => l.use === c); return `<div class="row between" style="gap:8px;margin:4px 0"><span class="small">${esc(c)}</span>${has ? '<span class="badge b-green">Recorded</span>' : `<button class="btn sm ghost" data-act="addRedLine" data-i="${i}">Record as a red line</button>`}</div>`; }).join('')}</div>`;
  } else if (id === 'B4') {
    const ev = P.events || [];
    h += table(['Ref', 'Event', 'Board approves before, or is told after', 'Brought by', 'Proposed by', 'Dissent', ''], ev.map(x => [refTip(x.id), pIn(id, `events.${x.id}.event`, x.event, { rows: 2, label: 'Event ' + x.id }), pIn(id, `events.${x.id}.timing`, x.timing, { list: 'dl_timing', ph: 'Before it starts', label: 'Timing of ' + x.id }), pIn(id, `events.${x.id}.by`, x.by, { list: 'dl_roles', ph: 'CEO', label: 'Who brings ' + x.id }), propSel(id, `events.${x.id}.proposedBy`, x.proposedBy), dissentIn(id, `events.${x.id}.dissent`, x.dissent), delBtn(id, 'events', x.id)]));
    h += `<datalist id="dl_timing"><option value="Before it starts"><option value="Before it takes effect"><option value="Told within 24 hours"><option value="Told at the next meeting"></datalist><datalist id="dl_roles"><option value="CEO"><option value="Chair"><option value="CRO"><option value="GC"></datalist>`;
    h += `<div class="row" style="gap:8px;margin:6px 0">${ev.length ? '' : '<button class="btn sm primary" data-act="loadStart" data-step="B4">Start from the six events RV1 to RV6</button>'}<button class="btn sm" data-act="addReserved">Add an event</button></div>`;
  } else if (id === 'B5') {
    const cells = P.cells || {}, bad = loosened(cells), isBad = (g, k) => bad.some(b => b.g === g && b.k === k);
    const marks = [['P', 'P'], ['C', 'C'], ['N', 'N']];
    h += table(['Class', ...SC.toolKind.map(k => ({ html: kindTip(k[0]) }))], SC.infoClass.map(g => [classTip(g[0]), ...SC.toolKind.map(k => { const v = cells[g[0] + ':' + k[0]]; const t = `${lbl(SC.infoClass, g[0])} in ${lbl(SC.toolKind, k[0]).replace(/^\w/, c => c.toLowerCase())}: ${v && C.tips.mark[v] ? C.tips.mark[v] : 'not marked yet.'}`; return `<span data-tip="${esc(t)}" style="display:block;${isBad(g[0], k[0]) ? 'outline:2px solid var(--red, #b42318);border-radius:6px' : ''}">${pIn(id, `cells.${g[0]}:${k[0]}`, v, { select: marks, blank: '—', label: `${lbl(SC.infoClass, g[0])} in ${lbl(SC.toolKind, k[0])}` })}</span>`; })]));
    h += '<p class="small soft">P permitted · C permitted with conditions, written below · N not permitted. K6 (data-room and document movement) is not marked: it is a path into the other kinds, not a tool. Moving down a column, a marking may stay or tighten; it may not loosen.</p>';
    if (bad.length) h += `<p class="small" role="alert" style="color:var(--red, #b42318);margin:4px 0">Loosens moving down: ${bad.map(b => `${esc(b.g)} in ${esc(lbl(SC.toolKind, b.k))} is less strict than ${esc(b.above)} above it`).join('; ')}. Check BK2 will fail until this changes.</p>`;
    h += sub('Conditions') + '<p class="small soft" style="margin:0 0 6px">A condition must be something management can show, for example “only with the enterprise licence that does not train on our content”.</p>'
      + `<div class="stack" style="gap:6px">${(P.conditions || []).map((c, i) => `<div style="display:flex;flex-wrap:nowrap;gap:8px;align-items:flex-start"><textarea class="in" style="flex:1 1 auto" rows="2" id="p_B5_cond_${i}" data-cond="${i}" aria-label="Condition ${i + 1}">${esc(c)}</textarea><button class="btn sm ghost" data-act="delCond" data-i="${i}">${UI.confirmDel === 'B5.cond.' + i ? 'Confirm' : 'Remove'}</button></div>`).join('')}</div><div class="row" style="margin:6px 0"><button class="btn sm" data-act="addCond">Add a condition</button></div>`
      + `<div class="fgrid" style="margin-top:8px"><label class="f"><span>Proposed by</span>${propSel(id, 'proposedBy', P.proposedBy)}</label><label class="f"><span>Dissent</span>${dissentIn(id, 'dissent', P.dissent)}</label></div>`;
  } else if (id === 'B6') {
    const hs = P.harms || {}, hint = C.starting.thresholdHints;
    h += table(['Harm to', 'We will not tolerate', 'Threshold', 'Source', 'Proposed by', 'Dissent'], SC.harm.map(x => { const v = hs[x[0]] || {}, k = `harms.${x[0]}`; return [esc(x[1]), pIn(id, k + '.statement', v.statement, { rows: 2, label: 'Not tolerated: ' + x[1] }), pIn(id, k + '.threshold', v.threshold, { ph: hint[x[0]], label: 'Threshold: ' + x[1] }), pIn(id, k + '.source', v.source, { list: 'dl_source', ph: 'Existing threshold, or New', label: 'Source: ' + x[1] }), propSel(id, k + '.proposedBy', v.proposedBy), dissentIn(id, k + '.dissent', v.dissent)]; }));
    h += '<datalist id="dl_source"><option value="New"><option value="Risk appetite statement"><option value="Delegations of authority"><option value="Incident thresholds"><option value="Complaints policy"></datalist><p class="small soft">A material AI incident is an AI failure that reaches any threshold above. RV5 (B4) and EV1 (B7) use this definition.</p>';
  } else if (id === 'B7') {
    const ms = P.measures || [], ev = P.events || [], goals = (pos('B2').goals || []);
    h += sub('At each meeting · three to five measures, each countable from the inventory or the action list');
    h += table(['Ref', 'Measure', 'Limit', 'Owner', ''], ms.map(x => [refTip(x.id) + (x.goal ? `<br><span class="small soft">for ${esc(x.goal)}</span>` : ''), pIn(id, `measures.${x.id}.measure`, x.measure, { rows: 2, label: 'Measure ' + x.id }), pIn(id, `measures.${x.id}.limit`, x.limit, { ph: 'e.g. 0', label: 'Limit for ' + x.id }), pIn(id, `measures.${x.id}.owner`, x.owner, { ph: 'Named person', label: 'Owner of ' + x.id }), delBtn(id, 'measures', x.id)]));
    if (ms.length > 5) h += '<p class="small" style="margin:4px 0">More than the five measures the framework suggests. Consider which the board will read.</p>';
    const linked = g => ms.some(m => m.goal === g.id) || ms.some(m => g.measure && new RegExp('^' + m.id + '\\b').test(g.measure));
    const open = goals.filter(g => g.measure && !linked(g));
    if (open.length) h += `<div class="panel2" style="padding:10px 14px;margin:6px 0"><p class="small" style="margin:0 0 6px"><strong>From the governance goals (B2).</strong> Each goal’s measure is reported here.</p>${open.map(g => `<div class="row between" style="gap:8px;margin:4px 0"><span class="small">${refTip(g.id)} ${esc(g.measure)}</span><button class="btn sm ghost" data-act="goalMeasure" data-id="${esc(g.id)}">Add as a measure</button></div>`).join('')}</div>`;
    h += sub('Between meetings');
    h += table(['Ref', 'Event', 'Reported to', 'Within', ''], ev.map(x => [refTip(x.id), pIn(id, `events.${x.id}.event`, x.event, { rows: 2, label: 'Event ' + x.id }), pIn(id, `events.${x.id}.to`, x.to, { list: 'dl_to', label: x.id + ' reported to' }), pIn(id, `events.${x.id}.within`, x.within, { ph: 'e.g. 24 hours', label: x.id + ' within' }), delBtn(id, 'events', x.id)]));
    h += '<datalist id="dl_to"><option value="Chair"><option value="Chair and GC"><option value="Accountable executive"><option value="Full board"></datalist>';
    h += `<div class="row" style="gap:8px;margin:6px 0">${ms.length || ev.length ? '' : '<button class="btn sm primary" data-act="loadStart" data-step="B7">Start from BM1 to BM5 and EV1 to EV4</button>'}<button class="btn sm" data-act="addMeasure">Add a measure</button><button class="btn sm" data-act="addEvent">Add an event</button></div>`;
    h += `<div class="fgrid" style="margin-top:8px"><label class="f"><span>Proposed by</span>${propSel(id, 'proposedBy', P.proposedBy)}</label><label class="f"><span>Dissent</span>${dissentIn(id, 'dissent', P.dissent)}</label></div>`;
  } else if (id === 'B8') {
    const o = P.owners || {}, ph = { AC1: 'e.g. Audit and risk committee, or the full board', AC2: 'Named director, or none', AC3: 'Named executive', AC4: 'One per area, or “each executive for their area”', AC5: 'Who, and within what limit' };
    h += table(['Ref', 'Accountability', 'Named'], SC.accountability.map(a => [`<span class="mono">${a[0]}</span>`, esc(a[1]), pIn(id, `owners.${a[0]}`, o[a[0]], { ph: ph[a[0]], label: a[1] })]));
    h += `<div class="fgrid" style="margin-top:8px"><label class="f"><span>Proposed by</span>${propSel(id, 'proposedBy', P.proposedBy)}</label><label class="f"><span>Dissent</span>${dissentIn(id, 'dissent', P.dissent)}</label></div>`;
  }
  return stepAids(id) + h + (UI.practice ? '<p class="small soft">Worked example: try it. Nothing is saved.</p>' : '');
}
/* Log a question to counsel from any step. */
function askBox(id) {
  if (askWhy()) return '';
  const v = (UI.qdraft || {})[id] || '';
  return `<details style="margin-top:10px" ${v ? 'open' : ''}><summary class="small" style="cursor:pointer">Log a question to counsel</summary><p class="small soft" style="margin:6px 0">For any point that turns on what the company is obliged to do. It goes to the GC in writing and is not settled in the room.</p><textarea class="in" rows="2" id="q_${id}" data-qstep="${id}" aria-label="Question to counsel at ${id}">${esc(v)}</textarea><div class="row" style="margin-top:6px"><button class="btn sm" data-act="askQ" data-step="${id}">Log the question</button></div></details>`;
}
function nextQRef() { const n = (S.questions || []).reduce((m, q) => Math.max(m, +String(q.ref).replace(/\D/g, '') || 0), 0) + 1; return 'QC-' + String(n).padStart(2, '0'); }
function stepBody(id) {
  const e = S.engagement, qs = (S.questions || []).filter(q => q.step === id);
  const questions = qs.length ? `<p class="mini" style="margin:12px 0 4px">Questions to counsel</p>` + table(['Ref', 'Question', 'Status', 'Counsel’s answer'], qs.map(q => [refTip(q.ref), esc(q.question) + '<br>' + by(q.raisedBy), q.status === 'answered' ? '<span class="badge b-green">Answered</span>' : '<span class="badge b-ochre">Open</span>', esc(q.response || '')])) : '';
  let h = '';
  if (id === 'B0') {
    const sa = S.scopeAgreed || {}, mb = e.matterBrief;
    h = `<dl class="kv"><dt>Company</dt><dd>${esc(e.company || '—')} · ${esc(lbl(C.entityTypes, e.entityType) || '—')} · ${esc(lbl(C.jurisdictions, e.jurisdiction))}</dd><dt>Mode</dt><dd>${esc(lbl(C.modes.map(m => [m.id, m.name]), e.mode))}</dd><dt>Scope agreed</dt><dd>${sa.gcBy ? 'GC: ' + esc(pname(sa.gcBy)) + ', ' + esc(dl(sa.gcOn)) : 'GC: not yet'} · ${sa.chairBy ? 'Chair: ' + esc(pname(sa.chairBy)) + ', ' + esc(dl(sa.chairOn)) : 'Chair: not yet'}</dd></dl>`
      + (mb ? `<p class="mini" style="margin:12px 0 4px">Obligations in scope, from the Atlas matter brief (${esc(mb.scope)})</p>` + table(['Tier', 'References'], mb.tiers.map(t => [esc(t.tier), t.refs.length ? t.refs.map(r => `<span class="mono">${esc(r[0])}</span> ${esc(r[1])}`).join('<br>') : '<span class="soft">None</span>'])) + '<p class="small soft">The brief lists what sources say by tier. Counsel decides what applies.</p>' : '<p class="small soft">No Atlas matter brief imported yet.</p>');
  } else if (id === 'B1') {
    h = inventoryBody();
  } else if (RULES.POSITION_STEPS.includes(id) && !posWhy()) {
    h = posEditor(id);
  } else if (id === 'B2') {
    const b2 = pos('B2'), goals = b2.goals || [];
    h = (goals.length ? '<p class="mini" style="margin:8px 0 4px">Governance goals</p>' + table(['Ref', 'Goal', 'Owner', 'Measure', 'Proposed by'], goals.map(g => [refTip(g.id), esc(g.goal), esc(g.owner), esc(g.measure), by(g.proposedBy)])) + '<p class="mini" style="margin:12px 0 4px">Posture by area</p>' : '') + table(['Area', 'Posture', 'Condition', 'Proposed by'], S.areas.filter(a => b2[a.id]).map(a => { const x = b2[a.id]; return [esc(a.name), x.posture === 'NS' ? tip('<strong>Not set</strong>', C.tips.notSet) + `<br><span class="small soft">${esc([x.notSetOwner, x.notSetBy].filter(Boolean).join(', by '))}</span>` : `<strong>${esc(lbl(SC.posture, x.posture))}</strong><br><span class="small soft">${esc((SC.posture.find(r => r[0] === x.posture) || [])[2] || '')}</span>`, esc(x.condition || ''), by(x.proposedBy) + dis(x)]; }));
  } else if (id === 'B3') {
    h = table(['Ref', 'Red line', 'Scope', 'Applies to', 'Proposed by'], (pos('B3').lines || []).map(x => [refTip(x.id), esc(x.use), esc(x.scope), esc(x.appliesTo), by(x.proposedBy) + dis(x)]));
  } else if (id === 'B4') {
    h = table(['Ref', 'Event', 'Board approves or is told', 'Brought by', 'Proposed by'], (pos('B4').events || []).map(x => [refTip(x.id), esc(x.event), esc(x.timing), esc(x.by), by(x.proposedBy) + dis(x)]));
  } else if (id === 'B5') {
    const b5 = pos('B5'), cells = b5.cells || {}, badge = (m, g, k) => { const t = m && C.tips.mark[m] ? `${lbl(SC.infoClass, g)} in ${lbl(SC.toolKind, k).replace(/^\w/, c => c.toLowerCase())}: ${C.tips.mark[m]}` : ''; return m === 'P' ? tip('P', t, 'badge b-green') : m === 'C' ? tip('C', t, 'badge b-ochre') : m === 'N' ? tip('N', t, 'badge b-red') : tip('<span class="soft">—</span>', `${lbl(SC.infoClass, g)} in ${lbl(SC.toolKind, k).replace(/^\w/, c => c.toLowerCase())}: not marked yet.`); };
    h = Object.keys(cells).length ? table(['Class', ...SC.toolKind.map(k => ({ html: kindTip(k[0]) }))], SC.infoClass.map(g => [classTip(g[0]), ...SC.toolKind.map(k => badge(cells[g[0] + ':' + k[0]], g[0], k[0]))])) + '<p class="small soft">P permitted · C permitted with conditions · N not permitted.</p>' + (b5.conditions || []).map(c => `<p class="small">${esc(c)}</p>`).join('') + (b5.proposedBy ? `<p class="small soft">Proposed by ${esc(pname(b5.proposedBy))}</p>` : '') : '';
  } else if (id === 'B6') {
    const hs = pos('B6').harms || {};
    h = table(['Harm to', 'We will not tolerate', 'Threshold', 'Source', 'Proposed by'], SC.harm.filter(x => hs[x[0]]).map(x => { const v = hs[x[0]]; return [esc(x[1]), esc(v.statement), esc(v.threshold), esc(v.source), by(v.proposedBy) + dis(v)]; }))
      + (Object.keys(hs).length ? '<p class="small soft">A material AI incident is an AI failure that reaches any threshold above.</p>' : '');
  } else if (id === 'B7') {
    const b7 = pos('B7');
    h = ((b7.measures || []).length ? '<p class="mini" style="margin:8px 0 4px">At each meeting</p>' + table(['Ref', 'Measure', 'Limit', 'Owner'], b7.measures.map(x => [refTip(x.id), esc(x.measure), esc(x.limit), esc(x.owner)])) : '')
      + ((b7.events || []).length ? '<p class="mini" style="margin:12px 0 4px">Between meetings</p>' + table(['Ref', 'Event', 'Reported to', 'Within'], b7.events.map(x => [refTip(x.id), esc(x.event), esc(x.to), esc(x.within)])) : '');
  } else if (id === 'B8') {
    const o = pos('B8').owners || {};
    h = table(['Accountability', 'Named'], SC.accountability.filter(a => o[a[0]]).map(a => [esc(a[1]), esc(o[a[0]])]));
  } else if (id === 'B9') {
    const r = S.resolution || {}, rl = reality();
    h = (r.by ? `<dl class="kv"><dt>Resolution</dt><dd>${esc(r.text || '')}</dd><dt>Recorded by</dt><dd>${esc(pname(r.by))}, ${esc(dl(r.on))} · ${esc(r.minuteRef || '')}</dd><dt>Review</dt><dd>${esc(r.interval || '')}</dd></dl>` : '')
      + (rl.length ? `<p class="mini" style="margin:12px 0 4px">${tip('Reality note', C.tips.reality)}: inventory lines that already cross a position (each goes on the 90-day action list)</p>` + table(['Line', 'Use', 'Why'], rl.map(([l, why]) => [refTip(l.id), esc(l.use), esc(why)])) : '');
  }
  return (h || '<p class="small soft">Nothing recorded yet.' + (['B0', 'B9'].includes(id) ? ' The screen for this step is added in development plan task ' + esc((C.steps.find(s => s.id === id) || {}).task || '') + '.' : '') + '</p>') + questions + (id === 'B0' || id === 'B9' ? '' : askBox(id));
}
const hasContent = id => id === 'B0' ? !!(S.engagement.company) : id === 'B1' ? (S.inventory || []).length > 0 : id === 'B9' ? !!(S.resolution || {}).by : Object.keys(pos(id)).length > 0;

/* ---------- screens ---------- */
const exampleOffer = () => `<div class="panel2" style="padding:14px 16px;margin-top:14px"><p style="margin:0 0 8px"><strong>See it worked through.</strong> A fictional manufacturer’s board takes all ten steps, from its AI inventory to a resolved statement.</p><button class="btn" data-act="example">Open the worked example</button></div>`;
function entryScreen() {
  if (!SRV.checked) return '<p class="soft">Connecting…</p>';
  if (!SRV.user) return `${opening('AI Board Direction', 'No access yet', '')}<div class="panel2" role="status" style="padding:12px 14px">${esc(SRV.reason || 'You have not been given access to this app.')} <a href="/auth/logout">Sign out</a></div>${exampleOffer()}`;
  const can = !RULES.deny('setup', me(), null);
  return `${opening('AI Board Direction', 'No engagement yet', 'This site holds one board engagement. It has not been started.')}
    <div class="panel2" style="padding:14px 16px">${can ? '<p>Start the engagement, then complete set-up: the company, the mode, the areas of the business and the board dates.</p><button class="btn primary" data-act="new">Start the engagement</button>' : '<p class="soft">Triodian or an administrator starts the engagement.</p>'}</div>${exampleOffer()}`;
}
function mainScreen() {
  const e = S.engagement, locked = !!RULES.deny('mode', me(), S) && RULES.modeLocked(S);
  const why = deny('setup'), whyNote = why ? `<p class="small soft" style="margin:6px 0">${esc(why)}</p>` : '';
  const people = (S.people || []).length ? S.people.map(p => `<div class="panel2" style="padding:10px 14px"><strong>${esc(p.name)}</strong>${p.organisation ? ` <span class="soft">· ${esc(p.organisation)}</span>` : ''}<div class="small soft">${esc(p.roles.map(roleName).join(', '))}</div></div>`).join('') : '<p class="small soft">No one has a role yet.</p>';
  const areas = S.areas.map((a, i) => `<div class="row" style="gap:8px"><input class="in" data-area="${i}" value="${esc(a.name)}" aria-label="Area ${i + 1}" ${why ? 'disabled' : ''}>${why ? '' : `<button class="btn sm ghost" data-act="delArea" data-i="${i}" aria-label="Remove ${esc(a.name)}">Remove</button>`}</div>`).join('');
  const steps = C.steps.map(s => `<details class="pr" id="step-${s.id}" ${UI.open && UI.open[s.id] ? 'open' : ''}><summary style="display:block"><span class="row between" style="width:100%"><strong style="color:var(--ink);font-size:15px"><span class="stepid">${s.id}</span>${esc(s.name)}</strong>${hasContent(s.id) ? '<span class="badge b-green">Recorded</span>' : '<span class="badge b-grey">Not yet</span>'}</span><span style="display:block;margin:6px 0 2px;font-weight:400;color:var(--ink);font-size:14px">${esc(s.question)}</span><span class="small soft" style="font-weight:400">Answered as: ${esc(s.answeredAs)}${e.mode === 'connected' && s.direction ? ` · Connected: ${esc(s.direction)}` : ''}</span></summary><div style="padding:0 20px 16px">${stepBody(s.id)}</div></details>`).join('');
  return `${opening('AI Board Direction', esc(e.company || 'New engagement'), 'Set-up comes first. The ten steps follow, worked through in the workshop and resolved at the next board meeting.')}
  ${actionsPanel()}
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
  <section class="card"><h2 class="sh">3 · Practitioner</h2><p class="small soft" style="margin:0 0 8px">The GC’s or advisory firm’s name, a line under it and a logo. They appear in the header and above the privilege marking on every Word and PDF output.</p><div class="fgrid">
    ${fld('Firm', 'engagement.practitioner.firm', (e.practitioner || {}).firm)}
    ${fld('Line under the name', 'engagement.practitioner.line', (e.practitioner || {}).line, { ph: 'Prepared by [firm] using the Triodian method' })}
  </div><div style="margin-top:14px">${TriodianBrand.logoControl(e.practitioner, deny('setup') ? 'disabled' : '')}</div></section>
  <section class="card"><div class="row between"><h2 class="sh" style="margin:0">4 · Areas of the business</h2>${why ? '' : '<button class="btn sm" data-act="addArea">Add an area</button>'}</div><p class="small soft">The board sets a posture for each area at B2. Change these to the company's own list.</p><div class="stack" style="gap:8px">${areas}</div></section>
  <section class="card"><div class="row between"><h2 class="sh" style="margin:0">5 · People</h2>${SRV.user && SRV.user.isAdmin ? '<a class="btn sm" href="/admin/">Manage in Admin</a>' : ''}</div><p class="small soft">Everyone with a role in this engagement. Roles are given in Admin.</p><div class="stack" style="gap:8px">${people}</div></section>
  <section class="card"><h2 class="sh">6 · The ten steps</h2><p class="small soft">From the Board AI Appetite Framework, section 4.1. Open a step to see what is recorded.${UI.practice ? ' In the worked example you can try the inventory (B1) and the positions (B2 to B8). Nothing is saved.' : ' The AI inventory (B1) and the board’s positions (B2 to B8) can be entered now. Set-up and pre-read (B0) and the resolution (B9) follow in phase 1 of the development plan.'}</p><div class="steplist">${steps}</div></section>`;
}
function render() {
  const app = document.getElementById('app');
  app.innerHTML = header() + `<main id="main" tabindex="-1"><div class="wrap">${S ? mainScreen() : entryScreen()}</div></main>` + footer() + drawer();
}

/* ---------- events ---------- */
TriodianBrand.bind(v => { setPath('engagement.practitioner.logo', v); render(); }, toast);
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.path) setPath(t.dataset.path, t.value);
  else if (t.dataset.pos) setPos(t.dataset.pos, t.dataset.ppath, t.tagName === 'SELECT' ? t.value : t.value.trim());
  else if (t.dataset.cond != null) { const why = posWhy(); if (why) { toast(why); return; } const P = posObj('B5'), i = +t.dataset.cond; P.conditions = P.conditions || []; const from = P.conditions[i], v = t.value.trim(); if (from === v) return; P.conditions[i] = v; log('edit', 'positions.B5.conditions.' + i, from == null ? null : from, v); rerender(); }
  else if (t.dataset.qstep) { UI.qdraft = UI.qdraft || {}; UI.qdraft[t.dataset.qstep] = t.value; }
  else if (t.dataset.ans) { UI.answer = UI.answer || {}; UI.answer[t.dataset.ans] = t.value; }
  else if (t.dataset.inv) setInv(t.dataset.inv, t.dataset.k, t.type === 'checkbox' ? t.checked : (t.tagName === 'SELECT' ? t.value : t.value.trim()));
  else if (t.dataset.area != null) { if (deny('setup')) return; const a = S.areas[+t.dataset.area], v = t.value.trim(); if (!a || a.name === v) return; const from = a.name; a.name = v; log('edit', 'areas.' + a.id, from, v); }
});
document.addEventListener('toggle', ev => { const d = ev.target; if (d && d.id && d.id.startsWith('step-')) { UI.open = UI.open || {}; UI.open[d.id.slice(5)] = d.open; } }, true);
/* The tip box: one element, placed under the item (or above it near the bottom of the window). */
let tipFor = null;
function showTip(el) {
  tipFor = el;
  let box = document.getElementById('tipbox');
  if (!box) { box = document.createElement('div'); box.id = 'tipbox'; box.setAttribute('role', 'tooltip'); document.body.appendChild(box); }
  box.textContent = el.dataset.tip; box.hidden = false; el.setAttribute('aria-describedby', 'tipbox');
  const r = el.getBoundingClientRect(), w = box.offsetWidth, hgt = box.offsetHeight;
  const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8));
  const top = r.bottom + 8 + hgt > innerHeight ? r.top - hgt - 8 : r.bottom + 8;
  box.style.left = left + 'px'; box.style.top = Math.max(8, top) + 'px';
}
function hideTip() { tipFor = null; const box = document.getElementById('tipbox'); if (box) box.hidden = true; document.querySelectorAll('[aria-describedby="tipbox"]').forEach(x => x.removeAttribute('aria-describedby')); }
document.addEventListener('mouseover', ev => { const t = ev.target.closest && ev.target.closest('[data-tip]'); if (t) showTip(t); });
document.addEventListener('mouseout', ev => { if (ev.target.closest && ev.target.closest('[data-tip]') && !(ev.relatedTarget && ev.relatedTarget.closest && ev.relatedTarget.closest('[data-tip]') === ev.target.closest('[data-tip]'))) hideTip(); });
document.addEventListener('focusin', ev => { const t = ev.target.closest && ev.target.closest('[data-tip]'); if (t) showTip(t); else hideTip(); });
document.addEventListener('focusout', ev => { if (ev.target.closest && ev.target.closest('[data-tip]')) hideTip(); });
addEventListener('scroll', () => { if (tipFor && document.body.contains(tipFor)) showTip(tipFor); else hideTip(); }, { passive: true, capture: true });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') hideTip(); });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && UI.drawer) { UI.drawer = false; render(); } });
document.addEventListener('click', async ev => {
  const b = ev.target.closest('[data-act]');
  if (!b) { if (UI.acct && !ev.target.closest('.acct')) { UI.acct = false; render(); } return; }
  const act = b.dataset.act;
  if (act === 'acct') { UI.acct = !UI.acct; UI.drawer = false; render(); }
  if (act === 'drawer') { UI.drawer = !UI.drawer; UI.acct = false; render(); }
  if (act === 'example') { markExampleLeft(false); openExample(); scrollTo(0, 0); }
  if (act === 'leaveExample') { markExampleLeft(true); UI.practice = false; UI.drawer = false; UI.open = {}; UI.editLine = ""; UI.confirmDel = ""; if (REAL) { S = REAL.S; SRV.rev = REAL.rev; SRV.exists = REAL.exists; } REAL = null; render(); scrollTo(0, 0); }
  if (act === 'new') { S = blank(); SRV.rev = 0; render(); await save(); if (SRV.exists) await load(); }
  if (act === 'addArea') { const n = S.areas.reduce((m, a) => Math.max(m, +String(a.id).replace(/\D/g, '') || 0), 0) + 1; S.areas.push({ id: 'A' + n, name: 'New area' }); log('add', 'areas.A' + n, null, 'New area'); render(); }
  if (act === 'addLine') {
    const why = invWhy(); if (why) { toast(why); return; }
    S.inventory = S.inventory || [];
    const first = !S.inventory.length, n = S.inventory.reduce((m, l) => Math.max(m, +String(l.id).replace(/\D/g, '') || 0), 0) + 1;
    const l = { id: 'L' + n, use: '', tool: '', area: '', who: '', authority: '', info: '', kind: '', adm: false, owner: '', source: `${myName()}, ${dl(todayISO())}`, decisions: '', personalInfo: '' };
    S.inventory.push(l); log('add', 'inventory.' + l.id, null, 'added');
    UI.editLine = l.id; UI.confirmDel = ''; UI.open = UI.open || {}; UI.open.B1 = true; render();
    const el = document.getElementById(`inv_${l.id}_use`); if (el) el.focus();
    if (first && !UI.practice) toast(`Line ${l.id} added. The mode is now fixed as ${lbl(C.modes.map(m => [m.id, m.name]), S.engagement.mode).toLowerCase()}.`);
  }
  if (act === 'editLine') { UI.editLine = UI.editLine === b.dataset.id ? '' : b.dataset.id; UI.confirmDel = ''; render(); const el = document.getElementById(`inv_${UI.editLine}_use`); if (el) { el.focus({ preventScroll: true }); document.getElementById('invedit').scrollIntoView({ block: 'center' }); } }
  if (act === 'doneLine') { UI.editLine = ''; UI.confirmDel = ''; render(); }
  if (act === 'keepLine') { UI.confirmDel = ''; render(); }
  if (act === 'delLine') {
    const id = b.dataset.id; if (invWhy()) { toast(invWhy()); return; }
    if (UI.confirmDel !== id) { UI.confirmDel = id; render(); return; }
    const i = S.inventory.findIndex(l => l.id === id); if (i < 0) return;
    const l = S.inventory.splice(i, 1)[0], q = lineQuestion(l); log('remove', 'inventory.' + id, l.use || id, null);
    UI.editLine = ''; UI.confirmDel = ''; render();
    toast(`Line ${id} removed.` + (q && q.status !== 'answered' ? ` ${q.ref} stays open for counsel to close.` : ''));
  }
  if (act === 'worklistDocx') downloadWorklist();
  // B2 to B8
  const posAct = ['addGoal', 'usePosture', 'addRedLine', 'addReserved', 'loadStart', 'addMeasure', 'addEvent', 'goalMeasure', 'delRow', 'addCond', 'delCond'];
  if (posAct.includes(act) && posWhy()) { toast(posWhy()); return; }
  const focusNew = sel => { render(); const el = document.querySelector(sel); if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'center' }); } };
  if (act === 'toggleGoalIdeas') { UI.goalIdeas = !UI.goalIdeas; render(); }
  if (act === 'toggleCand') { UI.cand = !UI.cand; render(); }
  if (act === 'addGoal') { const g = addRow('B2', 'goals', 'GL', { goal: b.dataset.i != null ? C.starting.goals[+b.dataset.i] : '', owner: '', measure: '', proposedBy: '' }); UI.goalIdeas = false; focusNew(`#p_B2_goals_${g.id}_goal`); }
  if (act === 'usePosture') setPos('B2', b.dataset.area + '.posture', b.dataset.v);
  if (act === 'addRedLine') { const r = addRow('B3', 'lines', 'RL', { use: b.dataset.i != null ? C.starting.redLineCandidates[+b.dataset.i] : '', scope: 'All areas', appliesTo: '', proposedBy: '' }); focusNew(b.dataset.i != null ? `#p_B3_lines_${r.id}_appliesTo` : `#p_B3_lines_${r.id}_use`); }
  if (act === 'addReserved') { const r = addRow('B4', 'events', 'RV', { event: '', timing: '', by: '', proposedBy: '' }); focusNew(`#p_B4_events_${r.id}_event`); }
  if (act === 'loadStart') {
    const st = b.dataset.step, P = posObj(st);
    if (st === 'B4' && !(P.events || []).length) { P.events = C.starting.reserved.map(([id, event]) => ({ id, event, timing: '', by: '', proposedBy: '' })); log('add', 'positions.B4.events', null, 'starting events RV1 to RV6'); }
    if (st === 'B7' && !(P.measures || []).length && !(P.events || []).length) { P.measures = C.starting.measures.map(([id, measure, limit]) => ({ id, measure, limit, owner: '' })); P.events = C.starting.events.map(([id, event, to]) => ({ id, event, to, within: '' })); log('add', 'positions.B7', null, 'starting measures BM1 to BM5 and events EV1 to EV4'); }
    render();
  }
  if (act === 'addMeasure') { const r = addRow('B7', 'measures', 'BM', { measure: '', limit: '', owner: '' }); focusNew(`#p_B7_measures_${r.id}_measure`); }
  if (act === 'addEvent') { const r = addRow('B7', 'events', 'EV', { event: '', to: '', within: '' }); focusNew(`#p_B7_events_${r.id}_event`); }
  if (act === 'goalMeasure') { const g = (pos('B2').goals || []).find(x => x.id === b.dataset.id); if (g) { addRow('B7', 'measures', 'BM', { measure: g.measure, limit: '', owner: g.owner || '', goal: g.id }); render(); } }
  if (act === 'delRow') {
    const { step, list, id } = b.dataset, k = step + '.' + list + '.' + id;
    if (UI.confirmDel !== k) { UI.confirmDel = k; render(); return; }
    const arr = posObj(step)[list] || [], i = arr.findIndex(x => x.id === id);
    if (i >= 0) { const x = arr.splice(i, 1)[0]; log('remove', `positions.${step}.${list}.${id}`, x.use || x.event || x.goal || x.measure || id, null); }
    UI.confirmDel = ''; render();
  }
  if (act === 'addCond') { const P = posObj('B5'); P.conditions = P.conditions || []; P.conditions.push(''); log('add', 'positions.B5.conditions.' + (P.conditions.length - 1), null, ''); focusNew(`#p_B5_cond_${P.conditions.length - 1}`); }
  if (act === 'delCond') {
    const i = +b.dataset.i, k = 'B5.cond.' + i;
    if (UI.confirmDel !== k) { UI.confirmDel = k; render(); return; }
    const P = posObj('B5'), from = (P.conditions || []).splice(i, 1)[0]; log('remove', 'positions.B5.conditions.' + i, from || '', null); UI.confirmDel = ''; render();
  }
  if (act === 'askQ') {
    const st = b.dataset.step, why = askWhy(); if (why) { toast(why); return; }
    const box = document.getElementById('q_' + st), text = (box ? box.value : '').trim();
    if (!text) { toast('Write the question first.'); if (box) box.focus(); return; }
    const ref = nextQRef(); S.questions = S.questions || [];
    S.questions.push({ ref, step: st, question: text, status: 'open', response: '', sentOn: todayISO(), raisedBy: myId() });
    log('add', 'questions.' + ref, null, 'open'); if (UI.qdraft) delete UI.qdraft[st];
    render(); toast(`${ref} logged for counsel.`);
  }
  if (act === 'inventoryCsv') downloadInventoryCsv();
  if (act === 'goB1') { UI.open = UI.open || {}; UI.open.B1 = true; render(); const d = document.getElementById('step-B1'); if (d) d.scrollIntoView({ block: 'start' }); }
  if (act === 'answerQ') {
    const ref = b.dataset.ref, why = deny('answer'); if (why) { toast(why); return; }
    const box = document.getElementById('ans_' + ref), text = (box ? box.value : '').trim();
    if (!text) { toast('Write the answer first.'); if (box) box.focus(); return; }
    const q = (S.questions || []).find(x => x.ref === ref); if (!q) return;
    q.response = text; q.respondedOn = todayISO(); q.respondedBy = SRV.user.id; q.status = 'answered';
    log('answer', 'questions.' + ref, 'open', 'answered'); if (UI.answer) delete UI.answer[ref];
    render(); toast(ref + ' answered. Triodian is told.');
  }
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
  if (openExampleByDefault()) openExample();
  else if (location.hash === '#actions') { const el = document.getElementById('actions'); if (el) el.scrollIntoView({ block: 'start' }); }
})();
window.BDApp = { state: () => S, render, practice: () => UI.practice };
})();
