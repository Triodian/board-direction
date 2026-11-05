// Who hears about what. Run: node tests/notify.test.mjs
import { eventsFromSave, dueReminders } from '../lib/core/notify.js';
const users = [{ id: 'gc', email: 'gc@x', roles: ['gc'], active: true }, { id: 'rc', email: 'rc@x', roles: ['recorder'], active: true }, { id: 'ch', email: 'ch@x', roles: ['chair'], active: true }, { id: 'av', email: 'av@x', roles: ['advisor'], active: true }];
const base = () => ({ engagement: { company: 'Acme' }, questions: [], scopeAgreed: {}, resolution: {} });
let fails = 0; const t = (label, ok) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' · ' + label); };
const n1 = base(); n1.questions.push({ ref: 'QC-01', question: 'Q?', status: 'open' });
t('a new question goes to the GC', eventsFromSave(base(), n1, users, users[3], 'https://x').map(m => m.to.id).join() === 'gc');
const n2 = JSON.parse(JSON.stringify(n1)); n2.questions[0].status = 'answered';
t('an answer goes to Triodian', eventsFromSave(n1, n2, users, users[0], 'https://x').map(m => m.to.id).join() === 'rc');
const n3 = base(); n3.resolution = { by: 'ch' };
t('the resolution goes to everyone else with a role', eventsFromSave(base(), n3, users, users[2], 'https://x').length === 3);
const d = base(); d.questions.push({ ref: 'QC-02', question: 'Old?', status: 'open', sentOn: '2026-11-01' });
t('a question open five days reminds the GC', dueReminders(d, users, '2026-11-06', 'https://x').length === 1);
t('a question open four days does not', dueReminders(d, users, '2026-11-05', 'https://x').length === 0);
console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
