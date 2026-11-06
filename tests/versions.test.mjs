// Versions at each sign-off (framework 9.4; plan task 1.10). Run: node tests/versions.test.mjs
import { signOffs, withVersions, snapshotOf } from '../lib/core/versions.js';
import { compareSnapshots, resolutionVersion } from '../public/shared/versions.js';
import { checkSave } from '../lib/core/rbac.js';

let fails = 0; const t = (label, ok, extra) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' · ' + label + (extra ? ' → ' + extra : '')); };
const users = [{ id: 'gc', name: 'Gina', roles: ['gc'], active: true }, { id: 'ch', name: 'Chris', roles: ['chair'], active: true }, { id: 'rc', name: 'Rae', roles: ['recorder'], active: true }];
const base = () => ({ schema: 'triodian.bd.v1', engagement: { id: 'e1', company: 'Acme', mode: 'standalone' }, areas: [{ id: 'A1', name: 'Sales' }], scopeAgreed: { gcBy: 'gc', gcOn: '2026-11-05' }, inventory: [{ id: 'L1', use: 'x' }], positions: {}, questions: [], resolution: {}, people: [], versions: [], history: [], education: {} });
const save = (o, who, f) => { const n = JSON.parse(JSON.stringify(o)); f(n); return checkSave(o, n, users.find(u => u.id === who), users); };

// the scope agreed: the second agreement issues V1
const r1 = save(base(), 'ch', n => { n.scopeAgreed.chairBy = 'ch'; n.scopeAgreed.chairOn = '2026-11-06'; });
t('the scope agreed issues V1', !r1.error && r1.data.versions.length === 1 && r1.data.versions[0].id === 'V1' && r1.data.versions[0].label === 'Scope agreed (B0)', r1.error);
t('V1 is signed by the server with the saver’s name', r1.data.versions[0].by === 'Chris');
t('V1 keeps the areas, inventory and positions as they were', r1.data.versions[0].snapshot.areas.join() === 'Sales' && r1.data.versions[0].snapshot.inventory.join() === 'L1');
// an ordinary save issues none
const r2 = save(r1.data, 'rc', n => { n.positions.B2 = { A1: { posture: 'S2' } }; });
t('an ordinary save issues no version', !r2.error && r2.data.versions.length === 1, r2.error);
// the resolution issues V2, with the resolution in its snapshot
const r3 = save(r2.data, 'ch', n => { n.resolution = { by: 'ch', on: '2026-12-02', minuteRef: 'M-1', text: 'Resolved' }; });
t('the resolution issues V2', !r3.error && r3.data.versions.map(v => v.id).join() === 'V1,V2' && r3.data.versions[1].label === 'Resolved by the board (B9)', r3.error);
t('V2 keeps the positions at the resolution', r3.data.versions[1].snapshot.positions.B2.A1.posture === 'S2' && r3.data.versions[1].snapshot.resolution.minuteRef === 'M-1');
t('the resolution version is found for the outputs’ status line', resolutionVersion(r3.data.versions).id === 'V2');
// a browser cannot add, change or remove a version
const r4 = save(r3.data, 'ch', n => { n.versions.push({ id: 'V3', label: 'Forged' }); n.resolution.minuteRef = 'M-1'; });
t('a version sent by the browser is ignored', !r4.data || r4.data.versions.length === 2, r4.error);
const r5 = save(r2.data, 'rc', n => { n.versions = []; });
t('versions removed by the browser are kept', !r5.error && r5.data.versions.length === 1, r5.error);
// signOffs only fires on the transition
t('no sign-off when nothing was signed', signOffs(base(), base()).length === 0);
t('withVersions reports whether it issued one', withVersions(r1.data, JSON.parse(JSON.stringify(r1.data)), 'x', 'now') === false);
// compare a version with now
const was = r1.data.versions[0].snapshot, now = snapshotOf({ ...r3.data, inventory: [{ id: 'L1' }, { id: 'L2' }], areas: [{ name: 'Sales' }, { name: 'Finance' }] });
const d = compareSnapshots(was, now);
t('compare: areas added', d.includes('Areas added: Finance.'), d.join(' | '));
t('compare: inventory lines added', d.some(x => x.startsWith('Inventory: 1 lines then, 2 now; added L2')), d.join(' | '));
t('compare: a step recorded since', d.includes('B2 Posture and governance goals: recorded since.'), d.join(' | '));
t('compare: resolved since', d.includes('Resolved by the board since.'));
t('compare: nothing changed', compareSnapshots(now, now).length === 0);
console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
