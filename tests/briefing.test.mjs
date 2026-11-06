// B0: the Atlas matter brief, the scope agreement and the director briefing. Run: node tests/briefing.test.mjs
import { readFileSync } from 'node:fs';
import { readBrief, briefMismatch, storedBriefError } from '../public/shared/matter-brief.js';
import { deny, seesAnswers, educationEntry, BRIEFING_CHECKS } from '../lib/core/rules.js';
import { checkSave } from '../lib/core/rbac.js';

let fails = 0;
const ok = (label, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS' : 'FAIL') + ' · ' + label + (extra ? ' → ' + extra : '')); };

// --- the matter brief ---
const raw = readFileSync(new URL('./fixtures/matter-brief-au.json', import.meta.url), 'utf8');
const names = { entityTypes: { anyOrganization: 'Any organisation', privateCompany: 'Private company' }, jurisdictions: { AU: 'Australia', SG: 'Singapore' } };
const r = readBrief(raw, names, '2026-11-05', 'Rae');
ok('a brief exported from the Atlas loads', !!r.brief, r.error);
ok('it keeps the obligations by tier', r.brief && r.brief.tiers.map(t => t.tier).join() === 'Binding,Expected,Anticipated' && r.brief.tiers.reduce((n, t) => n + t.refs.length, 0) === 5);
ok('it keeps the questions for counsel', r.brief && r.brief.questions.length === 8);
ok('it does not keep the matter label', r.brief && !JSON.stringify(r.brief).includes('Test matter'));
ok('it describes the scope in words', r.brief && r.brief.scope.startsWith('Any organisation · Australia · use cases UC1, UC3, UC6'), r.brief && r.brief.scope);
ok('a stored brief passes the save check', storedBriefError(r.brief) === '');
const bad = (label, text, want) => { const x = readBrief(text, names); ok(label, !!x.error && x.error.includes(want), x.error); };
bad('not JSON is refused', '{ not json', 'not valid JSON');
bad('another format is refused with the reason', JSON.stringify({ briefFormat: 'triodian.matterBrief/2' }), 'triodian.matterBrief/2');
bad('a file without briefFormat is refused', JSON.stringify({ hello: 1 }), 'no briefFormat');
const noTier = JSON.parse(raw); delete noTier.obligationsByTier.expected;
bad('a brief missing a tier is refused', JSON.stringify(noTier), 'obligations by tier');
const noId = JSON.parse(raw); noId.obligationsByTier.expected[0] = { title: 'x' };
bad('a reference without an ID is refused, naming it', JSON.stringify(noId), 'Reference 1 under Expected');
ok('no mismatch for an Australian private company', briefMismatch(r.brief, { jurisdiction: 'AU', entityType: 'privateCompany' }, names).length === 0);
ok('a Singapore company is told the brief covers Australia', briefMismatch(r.brief, { jurisdiction: 'SG', entityType: 'privateCompany' }, names).join().includes('covers AU'));

// --- the scope agreement: chair, or the named second approver where the GC also acts as counsel ---
const chair = { id: 'ch', roles: ['chair'] }, ceo = { id: 'ce', roles: ['ceo'] }, gc = { id: 'gc', roles: ['gc'] };
const S = (e = {}) => ({ engagement: { mode: 'standalone', ...e }, inventory: [] });
ok('the chair agrees to the scope', deny('agreeChair', chair, S()) === '');
ok('the CEO cannot record the chair’s agreement', deny('agreeChair', ceo, S()) !== '');
ok('GC also counsel: the named second approver agrees', deny('agreeChair', ceo, S({ gcActsAsCounsel: true, secondApproverId: 'ce' })) === '');
ok('GC also counsel: the chair is not the second approver unless named', deny('agreeChair', chair, S({ gcActsAsCounsel: true, secondApproverId: 'ce' })) !== '');
ok('GC also counsel and no second approver named: refused with the reason', deny('agreeChair', ceo, S({ gcActsAsCounsel: true })).includes('Name the second approver'));
ok('only the GC records the GC’s agreement', deny('agreeGC', gc, S()) === '' && deny('agreeGC', chair, S()) !== '');

// --- the director briefing ---
const dir = { id: 'd1', roles: ['director'] }, dir2 = { id: 'd2', roles: ['director'] }, adv = { id: 'av', roles: ['advisor'] }, rec = { id: 'rc', roles: ['recorder'] };
ok('a director sees their own answers', seesAnswers(dir, 'd1'));
ok('a director’s answers are refused to another director', !seesAnswers(dir2, 'd1'));
ok('the chair does not see a director’s answers', !seesAnswers(chair, 'd1'));
ok('the GC does not see a director’s answers', !seesAnswers(gc, 'd1'));
ok('the board advisor (facilitator) sees them', seesAnswers(adv, 'd1'));
ok('Triodian sees them', seesAnswers(rec, 'd1'));
ok('directors and the chair take the briefing', deny('briefing', dir, null) === '' && deny('briefing', chair, null) === '');
ok('the CEO and the advisor do not', deny('briefing', ceo, null) !== '' && deny('briefing', adv, null) !== '');
const all = Object.fromEntries(BRIEFING_CHECKS.map(q => [q, 'a']));
ok('read but not answered: read date only', JSON.stringify(educationEntry(null, {}, true, '2026-11-05')) === '{"readOn":"2026-11-05","completedOn":""}');
ok('answered but not read: not complete', educationEntry(null, all, false, '2026-11-05').completedOn === '');
ok('read and every question answered: complete', educationEntry(null, all, true, '2026-11-05').completedOn === '2026-11-05');
ok('dates are kept once set', educationEntry({ readOn: '2026-11-01', completedOn: '2026-11-02' }, all, true, '2026-11-09').completedOn === '2026-11-02');

// --- saves: the briefing record is the server's; the matter brief is Triodian's ---
const users = [{ id: 'rc', name: 'Rae', roles: ['recorder'], active: true }, { id: 'd1', name: 'Dee', roles: ['director'], active: true }, { id: 'ce', name: 'Ceo', roles: ['ceo'], active: true }];
const base = () => ({ schema: 'triodian.bd.v1', engagement: { id: 'e1', company: 'Acme', mode: 'standalone' }, areas: [], scopeAgreed: {}, inventory: [], positions: {}, questions: [], resolution: {}, people: [], versions: [], history: [], education: {} });
const save = (who, f) => { const o = base(), n = JSON.parse(JSON.stringify(o)); f(n); return checkSave(o, n, users.find(u => u.id === who), users); };
ok('a director cannot write the briefing record through a save', !!save('d1', n => { n.education.d1 = { readOn: '2026-11-05', completedOn: '2026-11-05' }; }).error);
ok('nor can Triodian', !!save('rc', n => { n.education.d1 = { readOn: 'x' }; }).error);
ok('Triodian loads the matter brief', !save('rc', n => { n.engagement.matterBrief = r.brief; }).error);
ok('the CEO cannot', !!save('ce', n => { n.engagement.matterBrief = r.brief; }).error);
ok('a malformed stored brief is refused', !!save('rc', n => { n.engagement.matterBrief = { tiers: 'x' }; }).error);

const agreed = () => { const o = base(); o.scopeAgreed = { chairBy: 'ce', chairOn: '2026-11-01' }; return o; };
{ const o = agreed(), n = JSON.parse(JSON.stringify(o)); n.scopeAgreed = { chairBy: '', chairOn: '' }; ok('the person who agreed may withdraw it after the set-up changes', !checkSave(o, n, users.find(u => u.id === 'ce'), users).error); }
{ const o = agreed(), n = JSON.parse(JSON.stringify(o)); n.scopeAgreed = { chairBy: '', chairOn: '' }; ok('nobody else may withdraw it', !!checkSave(o, n, users.find(u => u.id === 'rc'), users).error); }

console.log(fails ? `\n${fails} failed` : '\nAll passed');
process.exit(fails ? 1 : 0);
