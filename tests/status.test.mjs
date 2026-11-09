// The status the practice hub reads over a service binding (development plan task 4.1): stage, counts, roles and
// dates only, never names, inventory, positions or questions. Run: node tests/status.test.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { engagementStatus, STATUS_FORMAT } from '../lib/core/status.js';
import { statusForService } from '../src/status.js';

let fails = 0;
const ok = (label, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS' : 'FAIL') + ' · ' + label + (extra ? ' → ' + extra : '')); };
const ctx = { window: {}, TriodianBrand: { EXAMPLE_LOGO: '' } }; ctx.window.TriodianBrand = ctx.TriodianBrand; ctx.globalThis = ctx.window;
vm.runInNewContext(readFileSync(new URL('../public/bd-example.js', import.meta.url), 'utf8'), ctx);
const X = JSON.parse(JSON.stringify(ctx.window.BDExample()));
const KEYS = ['app', 'format', 'generated', 'lastActivity', 'nextBoardDate', 'nextSignOff', 'openActions', 'stage', 'waitingOn'];
const at = { today: '2026-11-10', now: '2026-11-10T00:00:00.000Z' };

// No engagement yet
let s = engagementStatus(null, at);
ok('no engagement: not started, nothing waiting', s.format === STATUS_FORMAT && s.app === 'board-direction' && s.stage.step === 0 && s.stage.steps === 10 && s.openActions === 0 && s.nextSignOff === null);

// The worked example is resolved; one question to counsel is still open
s = engagementStatus({ data: X, updatedAt: '2026-12-02T09:00:00Z' }, at);
ok('only the contract fields', JSON.stringify(Object.keys(s).sort()) === JSON.stringify(KEYS), Object.keys(s).join());
ok('resolved example: last step', s.stage.step === 10 && s.stage.label === 'Resolved by the board', JSON.stringify(s.stage));
ok('resolved example: the open question waits on the GC', JSON.stringify(s.waitingOn) === '[{"role":"GC","actions":1}]' && s.openActions === 1, JSON.stringify(s.waitingOn));
ok('resolved example: no sign-off left', s.nextSignOff === null);
ok('board dates still ahead are given', s.nextBoardDate === '2026-11-18', s.nextBoardDate);
ok('last activity is the save date', s.lastActivity === '2026-12-02');
const text = JSON.stringify(s);
const leaks = [X.engagement.company, ...X.people.map(p => p.name), ...X.inventory.map(l => l.tool), ...(X.questions || []).map(q => q.question), 'S2', 'posture'].filter(w => w && text.includes(w));
ok('no names, company, inventory, positions or questions', leaks.length === 0, leaks.join(' | '));

// Mid-way: scope agreed, inventory entered, B2 to B4 recorded, two directors not briefed, resolution ahead
const mid = JSON.parse(JSON.stringify(X)); mid.resolution = {}; ['B5', 'B6', 'B7', 'B8'].forEach(k => delete mid.positions[k]);
const users = [{ id: 'p-chair', roles: ['chair'] }, { id: 'p-dir1', roles: ['director'] }, { id: 'p-dir2', roles: ['director'] }, { id: 'p-x', roles: ['director'], active: false }, { id: 'p-gc', roles: ['gc'] }];
s = engagementStatus({ data: mid, updatedAt: '2026-11-09T01:00:00Z' }, { ...at, users });
ok('mid-way: the first step with nothing recorded', s.stage.step === 6 && s.stage.label === 'B5: Confidential information', JSON.stringify(s.stage));
ok('mid-way: a director still to brief, the open question', JSON.stringify(s.waitingOn) === '[{"role":"Directors","actions":1},{"role":"GC","actions":1}]', JSON.stringify(s.waitingOn));
ok('mid-way: the resolution is the next sign-off, with its meeting date', s.nextSignOff.label === 'The board resolves (B9)' && s.nextSignOff.due === '2026-12-02');

// Every step recorded but not resolved: the chair records the resolution
const ready = JSON.parse(JSON.stringify(X)); ready.resolution = {};
s = engagementStatus({ data: ready }, at);
ok('every step recorded: waits on the chair', s.stage.step === 10 && s.waitingOn.some(w => w.role === 'Chair' && w.actions === 1), JSON.stringify(s.waitingOn));

// A new engagement: the scope is the first sign-off, by the second approver where the GC also acts as counsel
const fresh = { engagement: { boardDates: { workshop: '2026-11-20', resolution: '' }, gcActsAsCounsel: true }, scopeAgreed: {}, inventory: [], positions: {}, questions: [], resolution: {} };
s = engagementStatus({ data: fresh }, at);
ok('new engagement: B0, waiting on the GC and the second approver', s.stage.step === 1 && JSON.stringify(s.waitingOn) === '[{"role":"GC","actions":1},{"role":"Second approver","actions":1}]', JSON.stringify(s.waitingOn));
ok('new engagement: scope sign-off due at the workshop', /agree the scope/.test(s.nextSignOff.label) && s.nextSignOff.due === '2026-11-20' && s.nextBoardDate === '2026-11-20');

// From the database, as the service answers
const dbWith = data => { const stmt = () => ({ bind() { return this; }, first: async () => data ? ({ revision: 3, data: JSON.stringify(data), updated_at: '2026-11-09T05:00:00Z', updated_by: 'y' }) : null, all: async () => ({ results: [] }), run: async () => ({ meta: {} }) }); return { prepare: stmt, batch: async () => [], exec: async () => ({}) }; };
s = await statusForService({ DB: dbWith(mid) }, new Date('2026-11-10T00:00:00Z'));
ok('statusForService reads the stored engagement', s.stage.step === 6 && s.lastActivity === '2026-11-09', JSON.stringify(s.stage));
const noTables = { prepare: () => ({ bind() { return this; }, first: async () => { throw new Error('D1_ERROR: no such table: engagement: SQLITE_ERROR'); }, all: async () => { throw new Error('D1_ERROR: no such table: users: SQLITE_ERROR'); } }) };
s = await statusForService({ DB: noTables }, new Date('2026-11-10T00:00:00Z'));
ok('a deployment nobody has opened (no tables yet): not started', s.stage.step === 0 && s.stage.label === 'Not started', JSON.stringify(s.stage));
let threw = false; try { await statusForService({}); } catch (e) { threw = true; }
ok('no database: it throws, so the hub shows the app as unreachable', threw);

// The entry point exports the status service; the service has one method
const idx = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8'), svc = readFileSync(new URL('../src/status-service.js', import.meta.url), 'utf8');
ok('src/index.js exports StatusService', /export \{ StatusService \} from '\.\/status-service\.js'/.test(idx));
ok('StatusService offers status() only', (svc.match(/async \w+\(/g) || []).join() === 'async status(' && /class StatusService extends WorkerEntrypoint/.test(svc));
console.log(fails ? `\n${fails} failed` : '\nAll passed'); process.exit(fails ? 1 : 0);
