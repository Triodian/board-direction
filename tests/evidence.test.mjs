// The APRA letter evidence index (development plan task R.2): AI Board Direction's own artefacts, the AI management
// review date that sets the review dates (ISO/IEC 42001 clause 9.3), and the route that gathers the other two apps'
// artefacts over the APPETITE binding. Run: node tests/evidence.test.mjs
import { checkSave } from '../lib/core/rbac.js';
import { handle } from '../lib/core/api.js';
import { boardArtefacts } from '../public/shared/evidence.js';

let fails = 0; const t = (label, ok, extra) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' · ' + label + (extra ? ' → ' + extra : '')); };
const users = [{ id: 'rc', name: 'Rae', roles: ['recorder'], active: true }];
const base = (extra = {}) => ({ schema: 'triodian.bd.v1', engagement: { id: 'e1', company: 'Acme Bank', mode: 'connected' }, areas: [], scopeAgreed: {}, inventory: [], positions: {}, questions: [], resolution: {}, people: [], versions: [], history: [], ...extra });
const save = (o, f) => { const n = JSON.parse(JSON.stringify(o)); f(n); return checkSave(o, n, users[0], users); };

t('an AI management review date is kept', !save(base(), n => { n.engagement.managementReview = '2027-03-31'; }).error, save(base(), n => { n.engagement.managementReview = '2027-03-31'; }).error);
t('a review date that is not a date is refused', /management review/.test(save(base(), n => { n.engagement.managementReview = 'next March'; }).error || ''));

let A = boardArtefacts(base({ inventory: [{ id: 'I1' }, { id: 'I2' }], directions: { by: 'ch', on: '2026-10-02' } }));
const by = id => A.find(a => a.id === id);
t('connected mode lists the directions paper, not the standalone statement', by('directions') && !by('statement') && !by('aupOutline'));
t('recorded directions are recorded evidence on the date the chair recorded them', by('directions').status === 'recorded' && by('directions').asOf === '2026-10-02');
t('the inventory is draft until the board resolves, with its line count', by('inventory').status === 'draft' && /2 lines/.test(by('inventory').note));
t('the board views are listed in connected mode', by('boardViews') && by('boardViews').status === 'none');
A = boardArtefacts(base({ engagement: { mode: 'standalone' }, resolution: { by: 'ch', on: '2026-11-04', minuteRef: 'BM-3' } }));
t('standalone, a resolved engagement records the statement at the resolution', by('statement').status === 'recorded' && by('statement').asOf === '2026-11-04' && !by('directions'));

const me = { id: 'rc', email: 'rae@example.com', name: 'Rae', organisation: '', roles: ['recorder'], isAdmin: false, active: true };
const store = new Proxy({ init: async () => {}, getUserByEmail: async () => me, getEngagement: async () => null, listUsers: async () => [me], audit: async () => {} }, { get: (o, k) => k in o ? o[k] : async () => null });
const call = async readEvidence => handle({ method: 'GET', path: '/api/evidence-from-appetite', email: me.email, readEvidence }, store).catch(e => ({ status: 'threw', body: { error: String(e) } }));
let r = await call(null);
t('with no APPETITE binding the route says the link is not set up', r.status === 503 && r.body.code === 'not_linked', JSON.stringify(r));
r = await call(async () => ({ format: 'triodian.evidence.v1', artefacts: [{ app: 'RA', id: 'statement' }], notes: [] }));
t('with the binding it answers what AI Risk Appetite gathered', r.status === 200 && r.body.artefacts[0].app === 'RA', JSON.stringify(r).slice(0, 200));
r = await call(async () => ({ status: 503, error: 'The Risk Appetite app could not be reached.' }));
t('an unreachable app answers 502 with the reason', r.status === 502 && /could not be reached/.test(r.body.error));
console.log(fails ? `\n${fails} failed` : '\nall passed'); process.exit(fails ? 1 : 0);
