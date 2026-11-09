// Where the engagement stands, for the practitioner's practice hub (development plan task 4.1). Cloud-neutral.
// The hub reads it over a service binding (src/status-service.js) and shows it beside the practitioner's other clients.
// It says where the work is and who it waits on, by role and count: no names, no inventory, no positions, no
// questions' wording, no answers. Format triodian.status.v1 (see Triodian/practice-hub README).

export const STATUS_FORMAT = 'triodian.status.v1';
const STEPS = [['B0', 'Set-up and pre-read'], ['B1', 'Where AI is used'], ['B2', 'Posture'], ['B3', 'Red lines'], ['B4', 'Reserved to the board'],
  ['B5', 'Confidential information'], ['B6', 'Harm we will not tolerate'], ['B7', 'What we expect to hear'], ['B8', 'Who is accountable'], ['B9', 'Resolve and review']];
const ymd = v => (/^\d{4}-\d{2}-\d{2}/.test(String(v || '')) ? String(v).slice(0, 10) : null);
const recorded = v => !!v && typeof v === 'object' && Object.keys(v).length > 0;

/**
 * e: the stored engagement ({ data, updatedAt }) or null. users: the app's users with roles (for the directors still
 * to complete the briefing; optional). today: 'YYYY-MM-DD'. now: an ISO timestamp.
 */
export function engagementStatus(e, { users = [], today, now } = {}) {
  today = today || new Date().toISOString().slice(0, 10);
  const base = { format: STATUS_FORMAT, app: 'board-direction', generated: now || new Date().toISOString() };
  if (!e || !e.data) return { ...base, stage: { label: 'Not started', step: 0, steps: STEPS.length }, openActions: 0, waitingOn: [], nextSignOff: null, nextBoardDate: null, lastActivity: null };
  const d = e.data, en = d.engagement || {}, sa = d.scopeAgreed || {}, dates = en.boardDates || {}, pos = d.positions || {};
  const resolved = !!((d.resolution || {}).by);
  const scoped = !!(sa.gcBy && sa.chairBy);

  // The step reached: B0 once the scope is agreed, B1 once the inventory has lines, B2 to B8 once anything is recorded
  // in them, B9 once the chair records the resolution. The stage is the first step not yet reached.
  const done = [scoped, (d.inventory || []).length > 0, ...STEPS.slice(2, 9).map(([id]) => recorded(pos[id])), resolved];
  const next = done.indexOf(false);
  const stage = next < 0 ? { label: 'Resolved by the board', step: STEPS.length, steps: STEPS.length }
    : { label: `${STEPS[next][0]}: ${STEPS[next][1]}`, step: next + 1, steps: STEPS.length };

  // Who it waits on, by role.
  const wait = new Map(), add = (role, n = 1) => { if (n > 0) wait.set(role, (wait.get(role) || 0) + n); };
  const second = en.gcActsAsCounsel ? 'Second approver' : 'Chair';
  if (!resolved) {
    if (!sa.gcBy) add('GC');
    if (!sa.chairBy) add(second);
    if (scoped && !(d.inventory || []).length) add('CEO');
    const briefed = id => !!(((d.education || {})[id] || {}).completedOn);
    add('Directors', users.filter(u => u.active !== false && (u.roles || []).some(r => r === 'chair' || r === 'director') && !briefed(u.id)).length);
    if (done.slice(0, 9).every(Boolean)) add('Chair'); // every step recorded: the chair records the resolution
  }
  add('GC', (d.questions || []).filter(q => q.status !== 'answered').length);
  const waitingOn = [...wait].map(([role, actions]) => ({ role, actions }));

  const nextSignOff = resolved ? null
    : !scoped ? { label: `The GC and the ${second.toLowerCase()} agree the scope (B0)`, due: ymd(dates.workshop) }
    : { label: 'The board resolves (B9)', due: ymd(dates.resolution) };
  const ahead = [ymd(dates.workshop), ymd(dates.resolution)].filter(x => x && x >= today).sort();
  return { ...base, stage, openActions: waitingOn.reduce((n, w) => n + w.actions, 0), waitingOn, nextSignOff,
    nextBoardDate: ahead[0] || null, lastActivity: ymd(e.updatedAt) };
}
