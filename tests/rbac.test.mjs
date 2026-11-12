// Server-side save check: who may change what. Run: node tests/rbac.test.mjs
import { checkSave, deny } from '../lib/core/rbac.js';
const users = [
  { id: 'mo', name: 'Mo', roles: ['methodOwner'], active: true }, { id: 'rc', name: 'Rae', roles: ['recorder'], active: true },
  { id: 'av', name: 'Avi', roles: ['advisor'], active: true }, { id: 'gc', name: 'Gia', roles: ['gc'], active: true },
  { id: 'ch', name: 'Cha', roles: ['chair'], active: true }, { id: 'dr', name: 'Dee', roles: ['director'], active: true },
  { id: 'ce', name: 'Ceo', roles: ['ceo'], active: true }, { id: 'cr', name: 'Cro', roles: ['cro'], active: true },
  { id: 'ad', name: 'Admin', roles: [], isAdmin: true, active: true }, { id: 'no', name: 'Nobody', roles: [], active: true },
  { id: 'to', name: 'Tess', roles: ['technologyOwner'], active: true }, { id: 'ag', name: 'Gov', roles: ['aiGovernance'], active: true }, { id: 'ag2', name: 'Gov two', roles: ['aiGovernance'], active: true },
];
const U = id => users.find(u => u.id === id);
const base = (mode = 'standalone') => ({ schema: 'triodian.bd.v1', engagement: { id: 'e1', company: 'Acme', mode, privilegeMarking: '' }, areas: [{ id: 'A1', name: 'Sales' }],
  scopeAgreed: { gcBy: '', gcOn: '', chairBy: '', chairOn: '' }, inventory: [], positions: {}, questions: [], resolution: {}, people: [], versions: [], history: [] });
let fails = 0;
const t = (label, who, mutate, expectOk, old) => { const o = old || base(), n = JSON.parse(JSON.stringify(o)); mutate(n); n.history.push({ at: 'x', action: 't' }); const r = checkSave(o, n, U(who), users); const okd = !r.error; if (okd !== expectOk) fails++; console.log((okd === expectOk ? 'PASS' : 'FAIL') + ' · ' + label + (r.error ? ' → ' + r.error : '')); return r; };

t('admin edits set-up', 'ad', n => { n.engagement.company = 'Acme Pty Ltd'; }, true);
t('recorder edits set-up', 'rc', n => { n.areas.push({ id: 'A2', name: 'Finance' }); }, true);
t('director cannot edit set-up', 'dr', n => { n.engagement.company = 'X'; }, false);
t('recorder changes the mode before the inventory', 'rc', n => { n.engagement.mode = 'connected'; }, true);
const withInv = base(); withInv.inventory.push({ id: 'L1', use: 'Drafting' });
t('mode is fixed once the inventory has a line', 'rc', n => { n.engagement.mode = 'connected'; }, false, withInv);
t('CEO adds an inventory line', 'ce', n => { n.inventory.push({ id: 'L1', use: 'Chat assistant' }); }, true);
t('board advisor cannot change the inventory', 'av', n => { n.inventory.push({ id: 'L1', use: 'x' }); }, false);
t('recorder records a posture proposed by a director', 'rc', n => { n.positions.B2 = { A1: { posture: 'S2', proposedBy: 'dr' } }; }, true);
t('a position cannot name the board advisor as proposer', 'rc', n => { n.positions.B2 = { A1: { posture: 'S2', proposedBy: 'av' } }; }, false);
t('a position cannot name the GC as proposer', 'rc', n => { n.positions.B2 = { A1: { posture: 'S2', proposedBy: 'gc' } }; }, false);
t('the board advisor cannot record a position', 'av', n => { n.positions.B3 = { list: [] }; }, false);
t('the GC cannot record a position', 'gc', n => { n.positions.B3 = { list: [] }; }, false);
t('standalone: the CRO cannot be a proposer', 'rc', n => { n.positions.B6 = { H3: { threshold: 'x', proposedBy: 'cr' } }; }, false);
t('connected: the CRO proposes and records', 'cr', n => { n.positions.B6 = { H3: { threshold: 'x', proposedBy: 'cr' } }; }, true, base('connected'));
t('B1 is not a positions step', 'rc', n => { n.positions.B1 = {}; }, false);
t('board advisor raises a question to counsel', 'av', n => { n.questions.push({ ref: 'QC-01', question: 'Must the board set this?', status: 'open' }); }, true);
const withQ = base(); withQ.questions.push({ ref: 'QC-01', question: 'Q?', status: 'open' });
t('GC answers', 'gc', n => { n.questions[0].response = 'Answer'; n.questions[0].status = 'answered'; }, true, withQ);
t('recorder cannot answer for counsel', 'rc', n => { n.questions[0].response = 'Answer'; }, false, withQ);
t('GC agrees the scope in own name', 'gc', n => { n.scopeAgreed.gcBy = 'gc'; n.scopeAgreed.gcOn = '2026-11-05'; }, true);
t('GC cannot record the chair’s agreement', 'gc', n => { n.scopeAgreed.chairBy = 'ch'; }, false);
t('chair records the resolution in own name', 'ch', n => { n.resolution = { by: 'ch', on: '2026-12-01', minuteRef: 'M-12' }; }, true);
t('director cannot record the resolution', 'dr', n => { n.resolution = { by: 'dr', on: '2026-12-01' }; }, false);
t('chair cannot record the resolution in another name', 'ch', n => { n.resolution = { by: 'dr', on: '2026-12-01' }; }, false);
const resolved = base(); resolved.resolution = { by: 'ch', on: '2026-12-01' };
t('resolved engagement refuses set-up', 'rc', n => { n.engagement.company = 'Y'; }, false, resolved);
t('history cannot be rewritten', 'rc', n => { n.history = []; }, false, (() => { const b = base(); b.history.push({ at: '1', action: 'a' }); return b; })());
t('a role with no rights cannot change anything', 'no', n => { n.engagement.reference = 'R'; }, false);
const v = t('scope agreed by both starts a version', 'ch', n => { n.scopeAgreed.chairBy = 'ch'; n.scopeAgreed.chairOn = 'x'; }, true, (() => { const b = base(); b.scopeAgreed.gcBy = 'gc'; b.scopeAgreed.gcOn = 'x'; return b; })());
if (!(v.data && v.data.versions.length === 1 && v.data.versions[0].label === 'Scope agreed (B0)')) { fails++; console.log('FAIL · version not added'); } else console.log('PASS · version added');
const first = checkSave(null, base(), U('dr'), users); if (!first.error) { fails++; console.log('FAIL · a director started the engagement'); } else console.log('PASS · only Triodian or an administrator starts the engagement');
const wrong = checkSave(null, { ...base(), schema: 'triodian.cea.v1' }, U('ad'), users); if (wrong.status !== 400) { fails++; console.log('FAIL · wrong schema accepted'); } else console.log('PASS · wrong schema refused');
// ---- Phase 7: the technology owner and the AI governance team (development plan tasks 7.2 and 7.3)
const chk = (label, cond) => { if (!cond) fails++; console.log((cond ? 'PASS' : 'FAIL') + ' · ' + label); };
let r = t('the AI governance team adds an inventory line', 'ag', n => { n.inventory.push({ id: 'L1', use: 'Chat assistant', suppliedBy: 'someone-else', confirmedBy: 'to' }); }, true);
chk('the line records who supplied it, whatever the browser sent, and starts unconfirmed', r.data.inventory[0].suppliedBy === 'ag' && !r.data.inventory[0].confirmedBy);
const inv1 = base(); inv1.inventory.push({ id: 'L1', use: 'Chat assistant', suppliedBy: 'ag' });
t('the technology owner edits an inventory line', 'to', n => { n.inventory[0].use = 'Chat assistant, licensed'; }, true, inv1);
r = t('the technology owner confirms a line in their own name', 'to', n => { n.inventory[0].confirmedBy = 'to'; n.inventory[0].confirmedOn = '2026-11-12'; }, true, inv1);
chk('the confirmation is kept and the supplier is unchanged', r.data.inventory[0].confirmedBy === 'to' && r.data.inventory[0].suppliedBy === 'ag');
t('the AI governance team cannot confirm a line', 'ag', n => { n.inventory[0].confirmedBy = 'ag'; }, false, inv1);
t('the CEO cannot confirm a line', 'ce', n => { n.inventory[0].confirmedBy = 'ce'; }, false, inv1);
t('a confirmation cannot be recorded in another name', 'to', n => { n.inventory[0].confirmedBy = 'ag'; }, false, inv1);
const inv2 = base(); inv2.inventory.push({ id: 'L1', use: 'Chat assistant', suppliedBy: 'ag', confirmedBy: 'to', confirmedOn: '2026-11-12' });
r = t('a change to a confirmed line by someone else withdraws the confirmation', 'ag2', n => { n.inventory[0].use = 'Changed'; }, true, inv2);
chk('the confirmation is withdrawn and the supplier kept', !r.data.inventory[0].confirmedBy && r.data.inventory[0].suppliedBy === 'ag');
r = t('the supplier of a line cannot be rewritten', 'ag2', n => { n.inventory[0].suppliedBy = 'ag2'; n.inventory[0].use = 'x'; }, true, inv1);
chk('the first supplier stays', r.data.inventory[0].suppliedBy === 'ag');
r = t('a company with neither role: the CEO supplies the line as before', 'ce', n => { n.inventory.push({ id: 'L1', use: 'Chat' }); }, true);
chk('the CEO is recorded as the supplier', r.data.inventory[0].suppliedBy === 'ce');
for (const who of ['to', 'ag']) {
  t(`${who} cannot record a posture`, who, n => { n.positions.B2 = { A1: { posture: 'S2', proposedBy: 'dr' } }; }, false);
  t(`${who} cannot be named as a proposer`, 'rc', n => { n.positions.B2 = { A1: { posture: 'S2', proposedBy: who } }; }, false);
  t(`${who} cannot record the resolution`, who, n => { n.resolution = { by: who, on: '2026-12-01' }; }, false);
  t(`${who} cannot record the board directions`, who, n => { n.directions = { by: who, on: '2026-12-01' }; }, false, base('connected'));
  t(`${who} cannot change set-up`, who, n => { n.engagement.company = 'X'; }, false);
}
r = t('the AI governance team drafts a measure', 'ag', n => { n.positions.B7 = { measures: [{ id: 'BM1', measure: 'Uses in the inventory', limit: '', owner: '' }] }; }, true);
chk('the measure records who drafted it', r.data.positions.B7.measures[0].draftedBy === 'ag');
const b7 = base(); b7.positions.B7 = { measures: [{ id: 'BM1', measure: 'Uses in the inventory', limit: '0', owner: 'CEO', draftedBy: 'ag' }], events: [{ id: 'EV1', event: 'A material AI incident', to: 'Chair', within: '24 hours' }], proposedBy: 'dr' };
t('the AI governance team edits a draft measure', 'ag', n => { n.positions.B7.measures[0].limit = '2'; }, true, b7);
t('the AI governance team cannot change who proposed the reporting', 'ag', n => { n.positions.B7.proposedBy = 'ce'; }, false, b7);
t('the AI governance team cannot change a reporting event', 'ag', n => { n.positions.B7.events[0].within = '48 hours'; }, false, b7);
t('the technology owner cannot add a reporting event', 'to', n => { n.positions.B7.events.push({ id: 'EV2', event: 'x' }); }, false, b7);
t('the technology owner confirms a draft measure', 'to', n => { n.positions.B7.measures[0].confirmedBy = 'to'; n.positions.B7.measures[0].confirmedOn = '2026-11-12'; }, true, b7);
t('the AI governance team cannot confirm a draft measure', 'ag', n => { n.positions.B7.measures[0].confirmedBy = 'ag'; }, false, b7);
t('a director still records the reporting, with its proposer', 'dr', n => { n.positions.B7.proposedBy = 'ch'; n.positions.B7.measures[0].limit = '1'; }, true, b7);
t('the board advisor cannot draft a measure', 'av', n => { n.positions.B7.measures[0].limit = '9'; }, false, b7);
const dirs = base('connected'); dirs.positions.B7 = JSON.parse(JSON.stringify(b7.positions.B7)); dirs.directions = { by: 'ch', on: '2026-12-01' };
r = t('confirming a measure does not withdraw the recorded board directions', 'to', n => { n.positions.B7.measures[0].confirmedBy = 'to'; n.positions.B7.measures[0].confirmedOn = '2026-11-12'; }, true, dirs);
chk('the directions stay recorded', r.data.directions.by === 'ch');
r = t('a change to a measure does withdraw them', 'ag', n => { n.positions.B7.measures[0].limit = '5'; }, true, dirs);
chk('the directions are withdrawn', !r.data.directions.by);
// the management briefing
r = t('the board advisor records the management briefing as held', 'av', n => { n.managementBriefing = { heldOn: '2026-11-06', attended: 'Advisor, GC and Triodian with the CIO', recordedBy: 'someone' }; }, true);
chk('it records who recorded it', r.data.managementBriefing.recordedBy === 'av');
t('the GC records that it is not needed, with the reason', 'gc', n => { n.managementBriefing = { notNeeded: 'No separate technology lead; the CEO holds it' }; }, true);
t('the chair records that it is not needed', 'ch', n => { n.managementBriefing = { notNeeded: 'No separate technology lead' }; }, true);
t('the technology owner cannot record it as held', 'to', n => { n.managementBriefing = { heldOn: '2026-11-06' }; }, false);
t('a director cannot record it as held', 'dr', n => { n.managementBriefing = { heldOn: '2026-11-06' }; }, false);
const held = base(); held.managementBriefing = { heldOn: '2026-11-06', recordedBy: 'av', confirmed: {} };
r = t('the technology owner confirms it as read, in their own name', 'to', n => { n.managementBriefing.confirmed.to = '2026-11-07'; }, true, held);
chk('the record of who recorded the meeting is unchanged', r.data.managementBriefing.recordedBy === 'av' && r.data.managementBriefing.confirmed.to === '2026-11-07');
t('the AI governance team confirms it as read', 'ag', n => { n.managementBriefing.confirmed.ag = '2026-11-07'; }, true, held);
t('nobody confirms it for someone else', 'ag', n => { n.managementBriefing.confirmed.to = '2026-11-07'; }, false, held);
t('a director does not confirm the management briefing', 'dr', n => { n.managementBriefing.confirmed.dr = '2026-11-07'; }, false, held);
t('the management briefing date is a date', 'av', n => { n.managementBriefing = { heldOn: 'yesterday' }; }, false);
{ const { managementBriefingState } = await import('../public/shared/rules.js');
  const S1 = { people: users.filter(u => u.roles.length), managementBriefing: { heldOn: '2026-11-06', confirmed: { to: 'x' } } };
  const st = managementBriefingState(S1);
  chk('the chair sees it was held and who has not yet confirmed', st.held && st.done && st.unconfirmed.map(p => p.id).join() === 'ag,ag2');
  chk('not needed, with a reason, also passes the step', managementBriefingState({ people: [], managementBriefing: { notNeeded: 'No separate technology lead' } }).done && !managementBriefingState({ people: [] }).done); }
console.log('deny position, no role:', deny('position', { id: 'z', roles: [] }, base()));
console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
