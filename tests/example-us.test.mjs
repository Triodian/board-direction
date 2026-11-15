// The United States worked examples (development plan task US.5): five fictional organisations, one per US main
// sector, each sound against the app's own rules, passing the checks, opening with its US pack, carrying a stored Atlas
// brief for the United States, and generating every output for its mode. Run: node tests/example-us.test.mjs
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
for (const f of ['bd-example.js', 'bd-example-super.js', 'bd-example-insurer.js', 'bd-example-bank.js', 'bd-example-us-briefs.js', 'bd-example-us.js', 'bd-outputs.js']) vm.runInNewContext(read(f), ctx);
const C = JSON.parse(read('bd-content.json'));
const W = ctx.window;

const US = { 'us-banking': ['Harlow Ridge Bank', 'bank', 'usBanking', 'connected'], 'us-insurance': ['Ashgrove Mutual Insurance Company', 'insurer', 'usInsurance', 'connected'], 'us-securities': ['Quillfield Securities LLC', 'capitalMarketsIntermediary', 'usSecurities', 'connected'], 'us-health': ['Fernhollow Health', 'healthServiceProvider', 'usHealth', 'standalone'], 'us-critical-infrastructure': ['Ridgeline Power & Transmission', 'criticalInfrastructureAssetOwner', 'usCriticalInfrastructure', 'standalone'] };
ok('the app lists the four Australian examples, then the five US ones', W.BDExamples.map(x => x.id).join() === 'unregulated,superannuation,insurance,banking,' + Object.keys(US).join());
ok('each US example names the United States as its jurisdiction, with a note and an offer and no "must" or "required"', W.BDExamples.filter(x => x.id.startsWith('us-')).every(x => x.jurisdiction === 'US' && /^Worked example: a fictional/.test(x.note) && /Nothing is saved\.$/.test(x.note) && x.offer && !/\b(must|required)\b/i.test(x.note + x.offer)));
const briefsSrc = read('bd-example-us-briefs.js');
ok('the briefs come from the Atlas’s published snapshot, not the preview', /from the AI Obligations Atlas published snapshot/.test(briefsSrc) && Object.values(W.BDUSBriefs).every(b => b.dataset && b.dataset.preview === false));

for (const [id, [company, et, packId, mode]] of Object.entries(US)) {
  const S = JSON.parse(JSON.stringify(W.BDExample(id))), e = S.engagement, P = S.positions, t = s => `${id}: ${s}`;
  const pack = C.sectorPacks.find(p => p.id === packId), sector = C.regulatedSectors.find(s => s.id === e.sector);
  ok(t(`it is ${company}, ${et} in ${mode} mode with the ${packId} pack`), e.company === company && e.entityType === et && e.jurisdiction === 'US' && e.mode === mode && e.sectorPack === packId && e.example === true && sector && sector.jurisdiction === 'US' && sector.mainSector && pack.sectors.includes(e.sector));
  ok(t('the engagement has the shape a save would need'), structureError(S) === '', structureError(S));
  ok(t('its areas are the US pack’s, in order'), S.areas.map(a => a.name).join('|') === pack.areas.join('|'));
  ok(t('the matter brief is a stored Atlas brief for the entity type in the United States, with US records'), storedBriefError(e.matterBrief) === '' && e.matterBrief.scopeCodes.jurisdictions.join() === (id === 'us-banking' ? 'US,US-NY' : 'US') && e.matterBrief.scopeCodes.entityTypes.join() === et && e.matterBrief.tiers.some(x => x.refs.some(r => /^OBL-US-/.test(r[0]))));

  const person = pid => S.people.find(p => p.id === pid), roleOf = pid => (person(pid) || {}).roles || [];
  ok(t('every role is one the app has; one technology owner and two in AI governance'), S.people.every(p => p.roles.every(r => ROLE_IDS.includes(r))) && S.people.filter(p => p.roles.includes('technologyOwner')).length === 1 && S.people.filter(p => p.roles.includes('aiGovernance')).length === 2);
  const named = []; (function walk(v) { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => { if (['proposedBy', 'owner', 'suppliedBy', 'confirmedBy', 'draftedBy', 'raisedBy', 'by', 'gcBy', 'chairBy', 'recordedBy'].includes(k) && typeof x === 'string' && /^p-/.test(x)) named.push(x); else walk(x); }); })({ i: S.inventory, p: P, q: S.questions, s: S.scopeAgreed, d: S.directions, r: S.resolution, m: S.managementBriefing });
  ok(t('everyone named in the record is one of its people'), named.every(person), named.filter(x => !person(x)).join());
  const props = []; (function walk(v) { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => { if (k === 'proposedBy') props.push(x); else walk(x); }); })(P);
  ok(t('every position is proposed by someone who may propose'), props.length > 20 && props.every(pid => proposerError(roleOf(pid), S) === ''), props.filter(pid => proposerError(roleOf(pid), S)).join());
  ok(t('the AI governance team supplied the inventory and the technology owner confirmed all but one line'), S.inventory.every(l => roleOf(l.suppliedBy).includes('aiGovernance')) && S.inventory.filter(l => !l.confirmedBy).length === 1 && S.inventory.filter(l => l.confirmedBy).every(l => roleOf(l.confirmedBy).includes('technologyOwner')));
  ok(t('the management briefing was held before the director briefing, and all three have read it'), managementBriefingState(S).held && managementBriefingState(S).unconfirmed.length === 0 && S.managementBriefing.heldOn < Object.values(S.education)[0].readOn);

  const areaIds = new Set(S.areas.map(a => a.id)), codes = k => new Set(C.scales[k].map(x => x[0]));
  ok(t('every inventory line is complete and uses the app’s scales'), S.inventory.length >= 10 && S.inventory.every(l => l.use && l.tool && areaIds.has(l.area) && l.who && codes('authority').has(l.authority) && codes('infoClass').has(l.info) && codes('toolKind').has(l.kind) && person(l.owner) && l.source));
  ok(t('each line about individuals says which decisions and what information, and has its question to counsel'), S.inventory.filter(l => l.adm).every(l => l.decisions && l.personalInfo && S.questions.some(q => (q.lines || []).includes(l.id))));
  ok(t('a posture for every area; the confidentiality table complete'), S.areas.every(a => codes('posture').has((P.B2[a.id] || {}).posture)) && Object.keys(P.B5.cells).length === 36);
  ok(t('one red line is the US pack’s own'), P.B3.lines.some(l => pack.redLineCandidates.includes(l.use)));
  ok(t('the fast path (BC2) and the productivity measures (BC4) are set'), P.B4.fastPath && P.B7.measures.some(m => m.id === 'BM7') && P.B7.measures.some(m => m.id === 'BM8'));
  const checks = runChecks(S, { harm: Object.fromEntries(C.scales.harm), owners: Object.fromEntries(C.scales.accountability) });
  ok(t('it passes all seven checks'), checks.length === 7 && checks.every(c => c.ok), checks.filter(c => !c.ok).map(c => c.id + ': ' + (c.fails || []).map(f => f.why || f).join('; ')).join(' | '));

  const v = recordedVersion(S);
  ok(t('the board directions are recorded in their own version, before the resolution'), !!v && v.id === 'V2' && S.directions.on < S.resolution.on && S.versions.map(x => x.label).join('|') === 'Scope agreed (B0)|Board directions recorded|Resolved by the board (B9)');
  if (mode === 'connected') {
    const dir = directionsFrom(v, C, S);
    ok(t('the directions the other apps read name the US jurisdiction, sector and pack'), dir.jurisdiction === 'US' && dir.sector === e.sector && dir.sectorPack === packId && dir.directions.BD1.areas.length === S.areas.length);
  }
  const { make } = W.BDOutputs, O = make(S, C, { today: '2026-12-20' });
  const docs = mode === 'connected' ? { directions: O.directions(), minute: O.minute(), actionList: O.actionList(), plan: O.plan(), crosswalk: O.crosswalk() } : { minute: O.minute(), actionList: O.actionList(), plan: O.plan(), crosswalk: O.crosswalk() };
  ok(t('every output generates with the marking first and the resolved status'), Object.values(docs).every(d => d.startsWith('Privileged and confidential') && /Resolved by the board, version V3/.test(d)), Object.entries(docs).filter(([, d]) => !/Resolved by the board, version V3/.test(d)).map(([k]) => k).join());
  const real = O.reality();
  ok(t('the reality note finds the unconfirmed consumer chatbot line and the meeting notes, and both reach the 90-day list'), real.some(x => x.line.tool === 'Not known: any consumer tool') && real.some(x => x.line.kind === 'K3' && x.kind === 'marking') && real.filter(x => x.line.kind === 'K5' || x.line.kind === 'K3').every(x => docs.actionList.includes('| ' + x.line.id + ' |')));
  ok(t('no output names a real product'), Object.values(docs).every(d => !/Microsoft|Copilot|ChatGPT|OpenAI|Google|Salesforce|Epic|Cerner|Oracle|Workday/i.test(d)));
}
ok('the examples name no real US bank, insurer, broker, health system, utility or vendor', !/JPMorgan|Chase|Wells Fargo|Citi|Bank of America|Goldman|Morgan Stanley|Schwab|Fidelity|Vanguard|State Farm|Allstate|Progressive|Liberty Mutual|Nationwide|Travelers|Kaiser|HCA|Mayo|Cleveland Clinic|Duke Energy|PG&E|Con Edison|Dominion|Exelon|Epic|Cerner|Oracle|Verisk|LexisNexis|FICO|Fiserv|Jack Henry|Visa|Mastercard|Nuance|Abridge/.test(read('bd-example-us.js')));
console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
