// Who hears about what. Run: node tests/notify.test.mjs
import { eventsFromSave, dueReminders } from '../lib/core/notify.js';
const users = [
  { id: 'gc', email: 'gc@x', roles: ['gc'], active: true }, { id: 'rc', email: 'rc@x', roles: ['recorder'], active: true },
  { id: 'ch', email: 'ch@x', roles: ['chair'], active: true }, { id: 'ce', email: 'ce@x', roles: ['ceo'], active: true },
  { id: 'd1', email: 'd1@x', roles: ['director'], active: true }, { id: 'd2', email: 'd2@x', roles: ['director'], active: true },
];
const U = id => users.find(u => u.id === id);
const base = () => ({ engagement: { company: 'Acme', boardDates: { workshop: '2026-11-20', resolution: '2026-12-04' } }, questions: [], scopeAgreed: {}, resolution: {}, inventory: [], positions: {}, areas: [], education: {} });
let fails = 0; const t = (label, ok, extra) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' · ' + label + (extra ? ' → ' + extra : '')); };
const to = msgs => msgs.map(m => m.to.id).sort().join();
const X = 'https://x';

// legal question to the GC
const n1 = base(); n1.questions.push({ ref: 'QC-01', question: 'Q?', status: 'open' });
t('a new question goes to the GC', to(eventsFromSave(base(), n1, users, U('ce'), X)) === 'gc');
const n2 = JSON.parse(JSON.stringify(n1)); n2.questions[0].status = 'answered';
t('an answer goes to Triodian', to(eventsFromSave(n1, n2, users, U('gc'), X)) === 'rc');
const d = base(); d.questions.push({ ref: 'QC-02', question: 'Old?', status: 'open', sentOn: '2026-11-01' });
t('a question open five days reminds the GC', to(dueReminders(d, users, '2026-11-06', X).filter(m => m.subject.startsWith('Questions'))) === 'gc');
t('a question open four days does not', dueReminders(d, users, '2026-11-05', X).filter(m => m.subject.startsWith('Questions')).length === 0);

// the scope agreement: one side tells the other; the second approver stands for the chair where the GC is also counsel
const g = base(); g.scopeAgreed = { gcBy: 'gc', gcOn: '2026-11-06' };
t('the GC’s agreement tells the chair', to(eventsFromSave(base(), g, users, U('gc'), X)) === 'ch');
const c = base(); c.scopeAgreed = { chairBy: 'ch', chairOn: '2026-11-06' };
t('the chair’s agreement tells the GC', to(eventsFromSave(base(), c, users, U('ch'), X)) === 'gc');
const g2 = JSON.parse(JSON.stringify(g)); g2.engagement.gcActsAsCounsel = true; g2.engagement.secondApproverId = 'ce';
t('GC also counsel: the second approver hears, not the chair', to(eventsFromSave(base(), g2, users, U('gc'), X)) === 'ce');

// a step waiting for you: once the scope is agreed, the CEO's inventory and each director's briefing
const both = JSON.parse(JSON.stringify(g)); both.scopeAgreed.chairBy = 'ch'; both.scopeAgreed.chairOn = '2026-11-06'; both.education = { d2: { readOn: '2026-11-05', completedOn: '2026-11-05' } };
const waiting = eventsFromSave(g, both, users, U('ch'), X);
t('scope agreed: the inventory waits for the CEO', waiting.some(m => m.to.id === 'ce' && m.subject.startsWith('The AI inventory is waiting')));
t('scope agreed: the briefing waits for directors who have not completed it (not the one who has)', to(waiting.filter(m => m.subject.startsWith('Your director briefing'))) === 'ch,d1');
t('the briefing email names the workshop date', waiting.find(m => m.to.id === 'd1').text.includes('20 November 2026'));
const full = JSON.parse(JSON.stringify(both)); full.inventory = [{ id: 'L1', use: 'u', tool: 't', area: 'A1', who: 'Staff', authority: 'A1', info: 'G2', kind: 'K2', owner: 'ce', source: 's' }];
t('a complete inventory does not wait', !eventsFromSave(g, full, users, U('ch'), X).some(m => m.to.id === 'ce'));

// before the workshop: the briefing and the inventory, if not done
const w = base(); w.education = { d1: { readOn: 'x', completedOn: '2026-11-10' } };
const pre = dueReminders(w, users, '2026-11-18', X);
t('two days before the workshop: directors yet to complete the briefing', to(pre.filter(m => m.key.startsWith('brief:'))) === 'ch,d2');
t('two days before the workshop: the CEO, the inventory having no lines', pre.some(m => m.key.startsWith('inv:ce') && m.text.includes('no lines yet')));
t('a week before the workshop: nothing about the briefing yet', !dueReminders(w, users, '2026-11-13', X).some(m => m.key.startsWith('brief:')));
t('after the workshop: nothing about the briefing', !dueReminders(w, users, '2026-11-21', X).some(m => m.key.startsWith('brief:')));

// resolution due: the chair and Triodian, with counts only
const r = base(); r.questions.push({ ref: 'QC-03', question: 'Q', status: 'open', sentOn: '2026-12-01' });
const due = dueReminders(r, users, '2026-11-30', X).filter(m => m.key.startsWith('res:'));
t('four days before the resolution: the chair and Triodian', to(due) === 'ch,rc');
t('it says how many checks pass and questions are open', due[0].text.includes('Checks passing:') && due[0].text.includes('Questions to counsel open: 1'));
t('it carries no position or inventory detail', !/L\d|RL\d|posture/i.test(due[0].text.replace(/BK\d [A-Za-z]+/g, '')));
t('eight days before: nothing yet', !dueReminders(r, users, '2026-11-26', X).some(m => m.key.startsWith('res:')));
const rr = JSON.parse(JSON.stringify(r)); rr.resolution = { by: 'ch', on: '2026-12-04' };
t('once resolved: no resolution or workshop reminders', !dueReminders(rr, users, '2026-12-01', X).some(m => /^(res|brief|inv):/.test(m.key)));
t('each reminder has a daily key, so it goes once a day', dueReminders(w, users, '2026-11-18', X).every(m => m.key.endsWith(':2026-11-18')));
const n3 = base(); n3.resolution = { by: 'ch' };
t('the resolution goes to everyone else with a role', eventsFromSave(base(), n3, users, U('ch'), X).length === 5);
console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
