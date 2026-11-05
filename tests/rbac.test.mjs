// Server-side save check: who may change what. Run: node tests/rbac.test.mjs
import { checkSave, deny } from '../lib/core/rbac.js';
const users = [
  { id: 'mo', name: 'Mo', roles: ['methodOwner'], active: true }, { id: 'rc', name: 'Rae', roles: ['recorder'], active: true },
  { id: 'av', name: 'Avi', roles: ['advisor'], active: true }, { id: 'gc', name: 'Gia', roles: ['gc'], active: true },
  { id: 'ch', name: 'Cha', roles: ['chair'], active: true }, { id: 'dr', name: 'Dee', roles: ['director'], active: true },
  { id: 'ce', name: 'Ceo', roles: ['ceo'], active: true }, { id: 'cr', name: 'Cro', roles: ['cro'], active: true },
  { id: 'ad', name: 'Admin', roles: [], isAdmin: true, active: true }, { id: 'no', name: 'Nobody', roles: [], active: true },
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
console.log('deny position, no role:', deny('position', { id: 'z', roles: [] }, base()));
console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
