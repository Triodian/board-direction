// The board directions feed (development plan task 3.4): the chair records them in connected mode, the server keeps
// that version, and GET /api/board-directions serves it, never the engagement as it is being edited.
// Run: node tests/directions.test.mjs
import { readFileSync } from 'node:fs';
import { checkSave } from '../lib/core/rbac.js';
import { issuedDirections, FORMAT } from '../lib/core/directions.js';
import { boardDirections } from '../lib/core/api.js';

let fails = 0; const t = (label, ok, extra) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' · ' + label + (extra ? ' → ' + extra : '')); };
const C = JSON.parse(readFileSync(new URL('../public/bd-content.json', import.meta.url), 'utf8'));
const users = [{ id: 'gc', name: 'Gina', roles: ['gc'], active: true }, { id: 'ch', name: 'Chris', roles: ['chair'], active: true }, { id: 'rc', name: 'Rae', roles: ['recorder'], active: true }];
const base = (mode = 'connected') => ({ schema: 'triodian.bd.v1', engagement: { id: 'e1', company: 'Acme Super', mode, jurisdiction: 'AU', sector: 'AU-SUPERANNUATION', entityType: 'superannuationTrustee', sectorPack: 'superTrustee' },
  areas: [{ id: 'A1', name: 'Member services and communications' }, { id: 'A2', name: 'Claims and group insurance' }], scopeAgreed: { gcBy: 'gc', gcOn: '2026-11-05', chairBy: 'ch', chairOn: '2026-11-06' }, inventory: [],
  positions: { B2: { A1: { posture: 'S3', condition: 'Within stated limits' }, A2: { posture: 'S2' } }, B3: { lines: [{ id: 'RL1', use: 'AI declining a death or disablement claim with no person reviewing it', scope: 'Claims and group insurance' }] },
    B4: { events: [{ id: 'RV1', event: 'A new AI use at A3 (Decides) or above', timing: 'Before it starts', by: 'CEO' }, { id: 'RV5', event: 'A material AI incident', timing: 'Told within 24 hours', by: 'CEO' }] },
    B6: { harms: { H1: { statement: 'A member wrongly denied a benefit', threshold: 'Any single instance' } } }, B7: { measures: [{ id: 'BM1', measure: 'AI uses', limit: 'n/a', owner: 'CEO' }], events: [] }, B8: { owners: { AC3: 'CEO' } } },
  questions: [], resolution: {}, people: [], versions: [], history: [] });
const save = (o, who, f) => { const n = JSON.parse(JSON.stringify(o)); f(n); return checkSave(o, n, users.find(u => u.id === who), users); };

t('before the chair records them there are none', issuedDirections(base(), C).status === 404);
t('a standalone engagement gives no directions', issuedDirections(base('standalone'), C).status === 404);
t('only the chair records them', !!save(base(), 'rc', n => { n.directions = { by: 'rc', on: '2026-11-10' }; }).error);
t('the chair records them in their own name only', /own name/.test(save(base(), 'ch', n => { n.directions = { by: 'gc', on: '2026-11-10' }; }).error || ''));
t('not in standalone mode', /connected mode/.test(save(base('standalone'), 'ch', n => { n.directions = { by: 'ch', on: '2026-11-10' }; }).error || ''));

const r1 = save(base(), 'ch', n => { n.directions = { by: 'ch', on: '2026-11-10' }; });
t('recording them issues a version', !r1.error && r1.data.versions.length === 1 && r1.data.versions[0].label === 'Board directions recorded', r1.error);
const d1 = issuedDirections(r1.data, C);
t('then they are served', d1.status === 200 && d1.body.format === FORMAT && d1.body.version === 'V1' && d1.body.status === 'recorded' && !d1.body.beingRevised);
const bd1 = d1.body.directions.BD1.areas;
t('BD1 gives each area its posture and the highest tier it accepts', bd1[0].name === 'Member services and communications' && bd1[0].maxTier === 'A4' && bd1[1].maxTier === 'A2' && bd1[0].condition === 'Within stated limits', JSON.stringify(bd1));
t('BD3 reads the lowest tier the board reserves before a use starts', d1.body.directions.BD3.reservedFrom === 'A3');
t('each direction names the decisions it is read on', d1.body.directions.BD1.readOn.join() === 'd1' && d1.body.directions.BD5.readOn.join() === 'd2' && d1.body.directions.BD6.readOn.join() === 'd7');
t('the file carries the sector pack, so Risk Appetite can match the areas to its functions', d1.body.sectorPack === 'superTrustee');

// a change to B2 to B8 withdraws the record; the recorded version is still what is served
const r2 = save(r1.data, 'rc', n => { n.positions.B2.A2.posture = 'S1'; });
t('changing a position afterwards withdraws the record', !r2.error && !(r2.data.directions || {}).by, r2.error);
const d2 = issuedDirections(r2.data, C);
t('the recorded version is still served, marked as being revised', d2.status === 200 && d2.body.version === 'V1' && d2.body.beingRevised === true && d2.body.directions.BD1.areas[1].maxTier === 'A2');
const r3 = save(r2.data, 'ch', n => { n.directions = { by: 'ch', on: '2026-11-11' }; });
const d3 = issuedDirections(r3.data, C);
t('recording them again issues the change as a new version', !r3.error && d3.body.version === 'V2' && d3.body.directions.BD1.areas[1].maxTier === 'A1' && !d3.body.beingRevised, r3.error);
const r4 = save(r3.data, 'ch', n => { n.resolution = { by: 'ch', on: '2026-12-02', text: 'Confirmed' }; });
t('after the resolution they are confirmed', issuedDirections(r4.data, C).body.status === 'confirmed');

// what GET /api/board-directions and the service binding answer, from the stored engagement
const res = await boardDirections({ getEngagement: async () => ({ data: r3.data, revision: 3 }) });
t('the API answers with the recorded version, built with the app content', res.status === 200 && res.body.version === 'V2' && res.body.directions.BD1.areas[0].postureLabel === 'Open', JSON.stringify(res).slice(0, 200));
t('with no engagement it answers 404', (await boardDirections({ getEngagement: async () => null })).status === 404);

console.log(fails ? `\n${fails} failed` : '\nall passed'); process.exit(fails ? 1 : 0);
