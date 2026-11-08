// The board view for each board meeting (development plan task 3.6): Triodian, the chair or the CEO takes it from AI
// Risk Appetite; each one is kept as taken, and stays open after the resolution. Run: node tests/board-view.test.mjs
import { readFileSync } from 'node:fs';
import { checkSave } from '../lib/core/rbac.js';

let fails = 0; const t = (label, ok, extra) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' · ' + label + (extra ? ' → ' + extra : '')); };
const V = JSON.parse(readFileSync(new URL('./e2e/fixtures/board-view.json', import.meta.url), 'utf8'));
const users = [{ id: 'ch', name: 'Chris', roles: ['chair'], active: true }, { id: 'dr', name: 'Dee', roles: ['director'], active: true }, { id: 'rc', name: 'Rae', roles: ['recorder'], active: true }];
const base = (extra = {}) => ({ schema: 'triodian.bd.v1', engagement: { id: 'e1', company: 'Acme Bank', mode: 'connected' }, areas: [], scopeAgreed: {}, inventory: [], positions: {}, questions: [], resolution: {}, people: [], versions: [], history: [], ...extra });
const view = (n = 1) => ({ id: 'BV' + n, meeting: '2026-12-02', takenOn: '2026-11-30', by: 'Chris', view: V });
const save = (o, who, f) => { const n = JSON.parse(JSON.stringify(o)); f(n); return checkSave(o, n, users.find(u => u.id === who), users); };

t('the chair takes the board view for a meeting', !save(base(), 'ch', n => { n.boardViews = [view()]; }).error, save(base(), 'ch', n => { n.boardViews = [view()]; }).error);
t('Triodian can too', !save(base(), 'rc', n => { n.boardViews = [view()]; }).error);
t('a director cannot', !!save(base(), 'dr', n => { n.boardViews = [view()]; }).error);
const one = base({ boardViews: [view()] });
t('a view already taken cannot be changed', /cannot be changed or removed/.test(save(one, 'ch', n => { n.boardViews[0].meeting = '2026-12-09'; }).error || ''));
t('nor removed', /cannot be changed or removed/.test(save(one, 'ch', n => { n.boardViews = []; }).error || ''));
t('a later meeting adds one', !save(one, 'ch', n => { n.boardViews.push({ ...view(2), meeting: '2027-03-03' }); }).error);
t('it stays open after the resolution', !save(base({ resolution: { by: 'ch', on: '2026-12-02' } }), 'ch', n => { n.boardViews = [view()]; }).error);
t('a view that is not a Risk Appetite board view is refused', save(base(), 'ch', n => { n.boardViews = [{ ...view(), view: { format: 'x' } }]; }).status === 400);
console.log(fails ? `\n${fails} failed` : '\nall passed'); process.exit(fails ? 1 : 0);
