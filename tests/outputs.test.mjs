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
  ok(`${id}: carries the status`, md.includes('Resolved by the board, 2 December 2026'), (md.match(/\*\*Harrow.*$/m) || [''])[0]);
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
ok('policy outline: seven headings', (docs.aupOutline.match(/^## \d\./gm) || []).length === 7);
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
ok('the list names each output once', new Set(LIST.map(x => x.id)).size === LIST.length);

console.log(fails ? `\n${fails} failed` : '\nAll passed');
process.exit(fails ? 1 : 0);
