// The outputs (task 1.8): each generates from the worked example, carries the marking and status, and follows the
// language rules of framework 8.8. Run: node tests/outputs.test.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

let fails = 0;
const ok = (label, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS' : 'FAIL') + ' · ' + label + (extra ? ' → ' + extra : '')); };

const ctx = { window: {}, TriodianBrand: { EXAMPLE_LOGO: '' } }; ctx.window.TriodianBrand = ctx.TriodianBrand; ctx.globalThis = ctx.window;
const read = f => readFileSync(new URL('../public/' + f, import.meta.url), 'utf8');
vm.runInNewContext(read('bd-example.js'), ctx);
vm.runInNewContext(read('bd-outputs.js'), ctx);
const C = JSON.parse(read('bd-content.json'));
const S = ctx.window.BDExample(), { make, LIST } = ctx.window.BDOutputs;
const O = make(S, C, { today: '2026-12-01' });

const docs = { statement: O.statement(), directions: O.directions(), aupOutline: O.aupOutline(), minute: O.minute(), actionList: O.actionList(), plan: O.plan() };
for (const [id, md] of Object.entries(docs)) {
  ok(`${id}: generates`, typeof md === 'string' && md.length > 300, String(md.length));
  ok(`${id}: privilege marking on the first line`, md.split('\n')[0] === S.engagement.privilegeMarking.trim(), md.split('\n')[0]);
  ok(`${id}: carries the status`, md.includes('Resolved by the board, version V2, 2 December 2026'), (md.match(/\*\*Harrow.*$/m) || [''])[0]);
  ok(`${id}: names no product`, !/AI Board Direction|Obligations Atlas|AI Use Assessment app|Triodian app/.test(md));
  ok(`${id}: says nothing about what the law requires`, !/law requires|legally required|you must comply|complies with/i.test(md));
  ok(`${id}: no unfilled template brackets except the overall position`, !/\[(company|date|reference|areas|whom|time)\]/.test(md.replace(/^.*\[For the board.*$/m, '')), (md.match(/\[[a-z ]+\]/g) || []).join(', '));
}
ok('statement: section 1 shows the governance goals (task 1.13)', docs.statement.includes('## 1. Purpose and scope') && docs.statement.includes('Keep customers’ and applicants’ trust'));
ok('statement: posture by area, with conditions', docs.statement.includes('| Customer service and communications | Cautious | The chatbot hands any complaint or refund to a person |'));
ok('statement: ten sections', (docs.statement.match(/^## \d+\./gm) || []).length === 10);
ok('statement: red lines listed', docs.statement.includes('AI holding credentials to release payments unattended'));
ok('statement: material AI incident defined', docs.statement.includes('A material AI incident is'));
ok('directions: BD1 to BD7', ['BD1', 'BD2', 'BD3', 'BD4', 'BD5', 'BD6', 'BD7'].every(d => docs.directions.includes('## ' + d)));
ok('policy outline: says it is not a policy', docs.aupOutline.includes('This outline is not a policy'));
ok('policy outline: eight headings', (docs.aupOutline.match(/^## \d\./gm) || []).length === 8);
// Task ISO.7: a route for raising a concern (ISO/IEC 42001:2023, A.3.3), and the measure the board hears it through.
ok('policy outline: raising a concern is a heading, tied to its measure', /## 7\. Raising a concern\n\n[^\n]*A\.3\.3 Reporting of concerns/.test(docs.aupOutline) && docs.aupOutline.includes('The board hears of concerns through measure BM6: Concerns about the use of AI raised through the reporting route, and how many remain open (limit: 0 open beyond 30 days).'));
ok('statement: the concerns measure is one of the board’s measures', docs.statement.includes('Concerns about the use of AI raised through the reporting route'));
ok('policy outline: decisions about individuals left to counsel', docs.aupOutline.includes('What the policy says about them is for counsel'));
ok('minute: the resolution and minute reference', docs.minute.includes(S.resolution.text) && docs.minute.includes('Board minute 2026/12-04'));
ok('minute: lists directors who did not complete the briefing', docs.minute.includes('Not completed before the resolution: Priya Raman'));
ok('action list: the red line the inventory crosses', docs.actionList.includes('Crosses red line RL2') && docs.actionList.includes('Stop L8'));
ok('action list: due 90 days from the resolution', docs.actionList.includes('2 March 2027'));
ok('plan: six steps with where each stands', (docs.plan.match(/^\| \d\. /gm) || []).length === 6 && docs.plan.includes('Resolved 2 December 2026'));
const conf = O.confidentiality();
ok('confidentiality file: format and status', conf.format === 'triodian.bd.confidentiality.v1' && conf.status === 'resolved');
ok('confidentiality file: 36 markings', Object.keys(conf.markings).length === 36, String(Object.keys(conf.markings).length));
ok('confidentiality file: no names or inventory lines', !/p-|Harrow|L\d\b|Raman|Okafor/.test(JSON.stringify(conf)));
// a draft says so
const D = JSON.parse(JSON.stringify(S)); D.resolution = {};
const OD = make(D, C, { today: '2026-12-01' });
ok('a draft is marked draft', OD.statement().includes('Draft, not resolved by the board') && OD.minute().includes('The resolution has not been recorded'));
ok('a draft’s actions fall due 90 days from today', OD.actionList().includes('1 March 2027'));
// an engagement with nothing recorded still generates, saying what falls back
const E = { engagement: { company: 'Empty Co', mode: 'standalone' }, areas: [{ id: 'A1', name: 'Sales' }], inventory: [], positions: {}, questions: [], resolution: {}, people: [] };
const OE = make(E, C, { today: '2026-12-01' });
ok('empty: statement says no red lines were set', OE.statement().includes('The board set no red lines.'));
ok('empty: reserved decisions fall back to the six starting events', OE.statement().includes('The six starting events apply'));
ok('empty: every list generates', ['statement', 'directions', 'aupOutline', 'minute', 'actionList', 'plan'].every(k => typeof OE[k]() === 'string'));
{ const cw = O.crosswalk();
  ok('crosswalk: one row for each step B0 to B9, against both frameworks', (cw.match(/^\| B\d /gm) || []).length === 10 && cw.includes('ISO/IEC 42001:2023') && cw.includes('NIST AI RMF 1.0'));
  ok('crosswalk: it says what the worked example recorded', /B1 Inventory \| 12 lines, 11 confirmed by the technology owner/.test(cw) && /management briefing held 6 November 2026/.test(cw) && /6 measures at each meeting/.test(cw) && /Resolved 2 December 2026/.test(cw));
  // Tasks ISO.4 and ISO.7: ISO/IEC 38507:2022 beside the other two, and a cross-walk for each scale the app uses.
  ok('crosswalk: each step names the governing body’s task under ISO/IEC 38507:2022', cw.includes('| ISO/IEC 38507:2022 |') && /\| B2 Posture and goals \|[^\n]*\| Direct: the objectives for the use of AI[^\n]*\|/.test(cw) && /\| B7 Reporting \|[^\n]*\| Monitor: what the governing body is told, and how fast \|/.test(cw));
  ok('crosswalk: the goals are clause 6.2, the owners A.3.2, and the harm thresholds an input to A.5.2 only', /B2 Posture and goals[^\n]*6\.2 AI objectives/.test(cw) && /B8 Accountability[^\n]*A\.3\.2 AI roles and responsibilities/.test(cw) && /B6 Harm thresholds[^\n]*an input to A\.5\.2, not an AI system impact assessment/.test(cw));
  ok('crosswalk: harm kinds beside A.5 and ISO/IEC 42005:2025, information classes beside the company’s own scheme', cw.includes('## Harm kinds H1 to H6 beside ISO/IEC 42001:2023 A.5 and ISO/IEC 42005:2025') && cw.includes('| H1 Customers or members | Individuals and groups of individuals | A.5.4') && cw.includes('## Information classes G1 to G6 beside the company’s own classification scheme (ISO/IEC 27002:2022, 5.12 and 5.13)') && cw.includes('| G6 Board and transaction |'));
  ok('crosswalk: it names clauses, controls and subcategories', ['5.2 AI policy', 'A.3.2 AI roles and responsibilities', '9.3 Management review', 'GOVERN 1.6', 'GOVERN 2.3', 'MAP 1.5'].every(x => cw.includes(x)));
  ok('crosswalk: it claims no conformity and gives no legal view', cw.includes('not a statement of conformity') && cw.includes('not legal advice') && !/\b(complies|compliant|conforms|meets the requirement|satisfies)\b/i.test(cw) && !/\b(must|required)\b/i.test(cw));
  const ce = OE.crosswalk();
  ok('crosswalk: an empty engagement shows each step as not yet recorded', (ce.match(/Not yet recorded/g) || []).length === 9 && ce.includes('Not yet resolved'));
  ok('crosswalk: it is in the list for both modes', LIST.some(x => x.id === 'crosswalk' && x.mode === 'both' && x.kind === 'docx')); }
ok('the list names each output once', new Set(LIST.map(x => x.id)).size === LIST.length);

console.log(fails ? `\n${fails} failed` : '\nAll passed');
process.exit(fails ? 1 : 0);
