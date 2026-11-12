// The insurance worked example (Corvane General Insurance, fictional): it is sound against the app's own rules, passes
// the checks that apply before the resolution, generates the connected-mode outputs, and uses the people and providers
// of the insurer examples in AI Risk Appetite and AI Use Assessment. Run: node tests/example-insurer.test.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { runChecks } from '../public/shared/checks.js';
import { structureError } from '../lib/core/rbac.js';
import { snapshotOf } from '../public/shared/versions.js';
import { directionsFrom, recordedVersion } from '../lib/core/directions.js';
import { proposerError, managementBriefingState, ROLE_IDS } from '../public/shared/rules.js';
import { storedBriefError } from '../public/shared/matter-brief.js';

let fails = 0;
const ok = (label, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS' : 'FAIL') + ' · ' + label + (extra ? ' → ' + extra : '')); };
const ctx = { window: { BDVersions: { snapshotOf } }, TriodianBrand: { EXAMPLE_LOGO: '' } }; ctx.window.TriodianBrand = ctx.TriodianBrand; ctx.globalThis = ctx.window;
const read = f => readFileSync(new URL('../public/' + f, import.meta.url), 'utf8');
for (const f of ['bd-example.js', 'bd-example-super.js', 'bd-example-insurer.js', 'bd-outputs.js']) vm.runInNewContext(read(f), ctx);
const C = JSON.parse(read('bd-content.json'));

ok('the app has three examples, in this order', ctx.window.BDExamples.map(x => x.id).join() === 'unregulated,superannuation,insurance');
ok('each has a name, a note and a line for the entry screen, with no "must" or "required"', ctx.window.BDExamples.every(x => x.name && /^Worked example: a fictional/.test(x.note) && /Nothing is saved\.$/.test(x.note) && x.offer && !/\b(must|required)\b/i.test(x.note + x.offer)));

const S = JSON.parse(JSON.stringify(ctx.window.BDExample('insurance'))), e = S.engagement, P = S.positions;
ok('it is Corvane General Insurance, a general insurer in connected mode with the insurer pack', e.company === 'Corvane General Insurance' && e.entityType === 'generalInsurer' && e.sector === 'AU-INSURANCE' && e.mode === 'connected' && e.sectorPack === 'generalInsurer' && e.example === true);
ok('the engagement has the shape a save would need', structureError(S) === '', structureError(S));
ok('the matter brief is a stored Atlas brief for a general insurer in Australia', storedBriefError(e.matterBrief) === '' && /General insurer · Australia/.test(e.matterBrief.scope) && e.matterBrief.tiers.some(t => t.refs.length), e.matterBrief.scope);
const pack = C.sectorPacks.find(p => p.id === 'generalInsurer');
ok('its areas are the insurer pack’s nine, in order', S.areas.map(a => a.name).join('|') === pack.areas.join('|'));

// people and roles
const person = id => S.people.find(p => p.id === id), roleOf = id => (person(id) || {}).roles || [];
ok('every role is one the app has', S.people.every(p => p.roles.every(r => ROLE_IDS.includes(r))));
ok('one technology owner and an AI governance team of two', S.people.filter(p => p.roles.includes('technologyOwner')).length === 1 && S.people.filter(p => p.roles.includes('aiGovernance')).length === 2);
ok('the ids the worked example relies on are present', ['p-rec', 'p-dir2', 'p-cio', 'p-chair', 'p-cro'].every(person));
ok('the people the other two apps’ insurer examples name are the same people here', ['Priya Natarajan', 'Helen Brandt', 'Ana Duarte', 'Marcus Lee', 'Tom Ellery', 'Imogen Hart', 'Tobias Reed', 'Wei Ling Chua'].every(n => S.people.some(p => p.name === n)));
const named = []; (function walk(v) { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => { if (['proposedBy', 'owner', 'suppliedBy', 'confirmedBy', 'draftedBy', 'raisedBy', 'by', 'gcBy', 'chairBy', 'recordedBy'].includes(k) && typeof x === 'string' && /^p-/.test(x)) named.push(x); else walk(x); }); })({ i: S.inventory, p: P, q: S.questions, d: S.directions, s: S.scopeAgreed, m: S.managementBriefing });
ok('everyone named in the record is one of its people', named.length > 40 && named.every(person), named.filter(x => !person(x)).join());
const props = []; (function walk(v) { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => { if (k === 'proposedBy') props.push(x); else walk(x); }); })(P);
ok('every position is proposed by someone who may propose in connected mode', props.length > 20 && props.every(id => proposerError(roleOf(id), S) === ''));
ok('the AI governance team supplied the inventory and the technology owner confirmed it, all but one line', S.inventory.every(l => roleOf(l.suppliedBy).includes('aiGovernance')) && S.inventory.filter(l => !l.confirmedBy).map(l => l.id).join() === 'L13' && S.inventory.filter(l => l.confirmedBy).every(l => roleOf(l.confirmedBy).includes('technologyOwner')));
ok('the management briefing was held before the director briefing, and all three have read it', managementBriefingState(S).held && managementBriefingState(S).unconfirmed.length === 0 && S.managementBriefing.heldOn < Object.values(S.education)[0].readOn);

// the inventory and the positions
const areaIds = new Set(S.areas.map(a => a.id)), codes = k => new Set(C.scales[k].map(x => x[0]));
ok('every inventory line is complete and uses the app’s scales', S.inventory.length === 13 && S.inventory.every(l => l.use && l.tool && areaIds.has(l.area) && l.who && codes('authority').has(l.authority) && codes('infoClass').has(l.info) && codes('toolKind').has(l.kind) && person(l.owner) && l.source));
ok('each line about individuals says which decisions and what information, and has its question to counsel', S.inventory.filter(l => l.adm).length === 2 && S.inventory.filter(l => l.adm).every(l => l.decisions && l.personalInfo && S.questions.some(q => (q.lines || []).includes(l.id))));
ok('a posture for all nine areas', S.areas.every(a => codes('posture').has((P.B2[a.id] || {}).posture)));
ok('the confidentiality table is complete', Object.keys(P.B5.cells).length === 36);
ok('the red lines include the pack’s two candidates', pack.redLineCandidates.every(r => P.B3.lines.some(l => l.use === r)));
const checks = runChecks(S, { harm: Object.fromEntries(C.scales.harm), owners: Object.fromEntries(C.scales.accountability) });
console.log('checks: ' + checks.map(c => c.id + (c.ok ? ' ok' : ' FAILS ' + (c.fails || []).map(f => f.why || f).join('; '))).join(' | '));
ok('it passes the seven checks', checks.length === 7 && checks.every(c => c.ok));

// the directions are recorded; the board has not yet resolved
const v = recordedVersion(S), dir = directionsFrom(v, C, S);
ok('the board directions are recorded in their own version, and there is no resolution yet', !!v && v.id === 'V2' && !S.resolution.by && S.versions.map(x => x.label).join('|') === 'Scope agreed (B0)|Board directions recorded');
const max = Object.fromEntries(dir.directions.BD1.areas.map(a => [a.name, a.maxTier]));
ok('BD1 gives each function a ceiling', JSON.stringify(max) === JSON.stringify({ 'Underwriting and pricing': 'A2', Claims: 'A2', 'Fraud and investigations': 'A2', 'Policy administration': 'A4', 'Complaints and disputes': 'A2', 'Customer communications': 'A4', 'Finance and reserving': 'A2', 'Legal and compliance': 'A1', 'Technology operations': 'A4' }), JSON.stringify(max));
ok('claims carries the board’s condition', dir.directions.BD1.areas.find(a => a.name === 'Claims').condition === 'A person decides every decline');

// the outputs, connected mode, before the resolution
const { make } = ctx.window.BDOutputs, O = make(S, C, { today: '2026-10-01' });
const docs = { directions: O.directions(), actionList: O.actionList(), plan: O.plan(), crosswalk: O.crosswalk() };
ok('the connected-mode documents generate, with the marking first', Object.values(docs).every(d => d.startsWith('Privileged and confidential')));
ok('the directions paper names the insurer and the claims condition', docs.directions.includes('Corvane General Insurance') && docs.directions.includes('A person decides every decline'));
const real = O.reality();
ok('the reality note: claims triage is above the Cautious posture, and two uses put board information where it is marked not permitted', real.some(x => x.line.id === 'L3' && x.kind === 'posture') && real.some(x => x.line.id === 'L11' && x.kind === 'marking') && real.some(x => x.line.id === 'L13'), real.map(x => x.line.id + ':' + x.kind).join());
ok('each becomes an action on the 90-day list', ['L3', 'L11', 'L13'].every(id => docs.actionList.includes('| ' + id + ' |')));
ok('no output names a real product', Object.values(docs).every(d => !/Microsoft|Copilot|ChatGPT|OpenAI|Google|Salesforce/i.test(d)));
ok('the example names no real insurer or provider', !/\bIAG\b|Suncorp|\bQBE\b|Allianz|\bNRMA\b|\bAAMI\b|Youi|Zurich|Hollard|Budget Direct|Gallagher|Crawford|Sedgwick|Guidewire|Duck Creek/.test(JSON.stringify({ ...S, engagement: { ...e, matterBrief: null } })));
console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
