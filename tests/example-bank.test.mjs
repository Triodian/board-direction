// The banking worked example (Wattlebrook Bank, fictional): it is sound against the app's own rules, passes the
// checks, generates every connected-mode output, and reads as one piece with the examples in AI Risk Appetite and AI
// Use Assessment. Run: node tests/example-bank.test.mjs
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
for (const f of ['bd-example.js', 'bd-example-super.js', 'bd-example-insurer.js', 'bd-example-bank.js', 'bd-outputs.js']) vm.runInNewContext(read(f), ctx);
const C = JSON.parse(read('bd-content.json'));

// the list of examples, by sector
const ids = ctx.window.BDExamples.map(x => x.id);
ok('the app has four examples, in this order', ids.join() === 'unregulated,superannuation,insurance,banking');
ok('each has a name, a note and a line for the entry screen, with no "must" or "required"', ctx.window.BDExamples.every(x => x.name && /^Worked example: a fictional/.test(x.note) && /Nothing is saved\.$/.test(x.note) && x.offer && !/\b(must|required)\b/i.test(x.note + x.offer)));
ok('an unknown or missing sector opens the first example', ctx.window.BDExample('payments').engagement.company === ctx.window.BDExample().engagement.company && ctx.window.BDExample().engagement.mode === 'standalone');

const S = JSON.parse(JSON.stringify(ctx.window.BDExample('banking'))), e = S.engagement, P = S.positions;
ok('it is Wattlebrook Bank, an ADI in connected mode with the ADI pack', e.company === 'Wattlebrook Bank' && e.entityType === 'authorisedDepositTakingInstitution' && e.sector === 'AU-BANKING' && e.mode === 'connected' && e.sectorPack === 'adi' && e.example === true);
ok('the engagement has the shape a save would need', structureError(S) === '', structureError(S));
ok('the matter brief is a stored Atlas brief for an ADI in Australia', storedBriefError(e.matterBrief) === '' && /Authorised deposit-taking institution · Australia/.test(e.matterBrief.scope) && e.matterBrief.tiers.some(t => t.refs.length));
const pack = C.sectorPacks.find(p => p.id === 'adi');
ok('its areas are the ADI pack’s nine, in order', S.areas.map(a => a.name).join('|') === pack.areas.join('|'));

// people and roles
const person = id => S.people.find(p => p.id === id), roleOf = id => (person(id) || {}).roles || [];
ok('every role is one the app has', S.people.every(p => p.roles.every(r => ROLE_IDS.includes(r))));
ok('one technology owner and an AI governance team of two', S.people.filter(p => p.roles.includes('technologyOwner')).length === 1 && S.people.filter(p => p.roles.includes('aiGovernance')).length === 2);
ok('the ids the worked example relies on are present', ['p-rec', 'p-dir2', 'p-cio', 'p-chair', 'p-cro'].every(person));
const named = []; (function walk(v) { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => { if (['proposedBy', 'owner', 'suppliedBy', 'confirmedBy', 'draftedBy', 'raisedBy', 'by', 'gcBy', 'chairBy', 'recordedBy'].includes(k) && typeof x === 'string' && /^p-/.test(x)) named.push(x); else walk(x); }); })({ i: S.inventory, p: P, q: S.questions, s: S.scopeAgreed, d: S.directions, r: S.resolution, m: S.managementBriefing });
ok('everyone named in the record is one of its people', named.every(person), named.filter(x => !person(x)).join());
const props = []; (function walk(v) { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => { if (k === 'proposedBy') props.push(x); else walk(x); }); })(P);
ok('every position is proposed by someone who may propose in connected mode', props.length > 20 && props.every(id => proposerError(roleOf(id), S) === ''));
ok('the AI governance team supplied the inventory and the technology owner confirmed it, all but one line', S.inventory.every(l => roleOf(l.suppliedBy).includes('aiGovernance')) && S.inventory.filter(l => !l.confirmedBy).map(l => l.id).join() === 'L13' && S.inventory.filter(l => l.confirmedBy).every(l => roleOf(l.confirmedBy).includes('technologyOwner')));
ok('the management briefing was held before the director briefing, and all three have read it', managementBriefingState(S).held && managementBriefingState(S).unconfirmed.length === 0 && S.managementBriefing.heldOn < Object.values(S.education)[0].readOn);

// the inventory and the positions
const areaIds = new Set(S.areas.map(a => a.id)), codes = k => new Set(C.scales[k].map(x => x[0]));
ok('every inventory line is complete and uses the app’s scales', S.inventory.length === 13 && S.inventory.every(l => l.use && l.tool && areaIds.has(l.area) && l.who && codes('authority').has(l.authority) && codes('infoClass').has(l.info) && codes('toolKind').has(l.kind) && person(l.owner) && l.source));
ok('each line about individuals says which decisions and what information, and has its question to counsel', S.inventory.filter(l => l.adm).every(l => l.decisions && l.personalInfo && S.questions.some(q => (q.lines || []).includes(l.id))));
ok('a posture for all nine areas', S.areas.every(a => codes('posture').has((P.B2[a.id] || {}).posture)));
ok('the confidentiality table is complete', Object.keys(P.B5.cells).length === 36);
const checks = runChecks(S, { harm: Object.fromEntries(C.scales.harm), owners: Object.fromEntries(C.scales.accountability) });
ok('it passes all seven checks', checks.length === 7 && checks.every(c => c.ok), checks.filter(c => !c.ok).map(c => c.id + ': ' + (c.fails || []).map(f => f.why || f).join('; ')).join(' | '));

// the same directions the other two apps' examples are built within
const v = recordedVersion(S), dir = directionsFrom(v, C, S);
ok('the board directions are recorded, in their own version, before the resolution', !!v && v.id === 'V2' && S.directions.on < S.resolution.on && S.versions.map(x => x.label).join('|') === 'Scope agreed (B0)|Board directions recorded|Resolved by the board (B9)');
const max = Object.fromEntries(dir.directions.BD1.areas.map(a => [a.name, a.maxTier]));
ok('BD1 gives each function the ceiling the appetite example stays within', JSON.stringify(max) === JSON.stringify({ 'Retail lending and credit decisions': 'A2', 'Deposits and payments': 'A4', 'Business and institutional banking': 'A2', 'Financial crime (AML/CTF, fraud and scams)': 'A2', 'Collections and financial hardship': 'A2', 'Customer service and complaints': 'A4', 'Treasury, markets and finance': 'A2', 'Risk, legal and compliance': 'A1', 'Technology and operations': 'A4' }), JSON.stringify(max));
ok('financial crime carries the board’s condition', dir.directions.BD1.areas.find(a => a.name === 'Financial crime (AML/CTF, fraud and scams)').condition === 'A person decides before an account is frozen or closed');

// the outputs, connected mode
const { make, LIST } = ctx.window.BDOutputs, O = make(S, C, { today: '2026-12-01' });
const docs = { directions: O.directions(), minute: O.minute(), actionList: O.actionList(), plan: O.plan(), crosswalk: O.crosswalk() };
ok('every connected-mode document generates, with the marking first and the resolved status', Object.values(docs).every(d => d.startsWith('Privileged and confidential') && d.includes('Resolved by the board, version V3, 25 November 2026')));
ok('the directions paper names the bank and the financial crime condition', docs.directions.includes('Wattlebrook Bank') && docs.directions.includes('A person decides before an account is frozen or closed'));
const real = O.reality();
ok('the reality note: scam screening is above the Cautious posture, and two uses put board information where it is marked not permitted', real.some(x => x.line.id === 'L3' && x.kind === 'posture') && real.some(x => x.line.id === 'L11' && x.kind === 'marking') && real.some(x => x.line.id === 'L13'));
ok('each becomes an action on the 90-day list', ['L3', 'L11', 'L13'].every(id => docs.actionList.includes('| ' + id + ' |')));
ok('the crosswalk counts what was recorded', /B1 Inventory \| 13 lines, 12 confirmed by the technology owner/.test(docs.crosswalk) && /management briefing held 8 October 2026/.test(docs.crosswalk));
ok('no output names a real product, and none says "must" of the board', Object.values(docs).every(d => !/Microsoft|Copilot|ChatGPT|OpenAI|Google|Salesforce/i.test(d)));
ok('the example names no real bank or provider', !/Commonwealth Bank|\bCBA\b|Westpac|\bANZ\b|\bNAB\b|Macquarie|Bendigo|Suncorp|Bank of Queensland|\bBOQ\b|\bING\b|\bAMP\b|Judo|Great Southern|Heritage|Teachers Mutual|Cuscal|Indue|\bFIS\b|Temenos|Finastra|Mastercard|\bVisa\b|BioCatch|Feedzai|Equifax|illion/.test(JSON.stringify({ ...S, engagement: { ...e, matterBrief: null } })));
console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
