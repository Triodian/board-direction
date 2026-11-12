// Permission rules for AI Board Direction, shared by the server (lib/core/rbac.js) and the browser (bd.js).
// One copy, so the reason a control is disabled on screen is the reason the server would refuse the save.
// Plain JavaScript, no platform code. The method is the Board AI Appetite Framework (draft of 5 November 2026).
//
// The engagement document (schema triodian.bd.v1):
//   engagement     company, entity type, jurisdiction, mode (standalone or connected), reference, privilege marking,
//                  practitioner branding, board dates, whether the GC also acts as counsel and the second approver
//   areas          the areas of the business (BP0.3), { id, name }
//   scopeAgreed    BP0.6: the GC's and the chair's agreement to the scope
//   inventory      B1, one line per AI use, { id, ..., suppliedBy, confirmedBy, confirmedOn }
//   managementBriefing  the briefing of management before anything reaches directors (development plan task 7.3)
//   positions      B2 to B8, keyed by step: each holds the board's recorded positions and who proposed them
//   questions      questions to counsel, QC-01 onward
//   resolution     B9: who recorded it, when, the minute reference, the review interval
//   versions, previous, history

export const ROLES = [
  { id: 'methodOwner', name: 'Method owner (Triodian)' },
  { id: 'recorder', name: 'Recorder (Triodian)' },
  { id: 'advisor', name: 'Board advisor' },
  { id: 'gc', name: 'General counsel' },
  { id: 'chair', name: 'Chair (board)' },
  { id: 'director', name: 'Director (board)' },
  { id: 'ceo', name: 'CEO or accountable executive (company)' },
  { id: 'cro', name: 'CRO (company, connected mode)' },
  { id: 'areaOwner', name: 'Area owner (company)' },
  { id: 'technologyOwner', name: 'Technology owner (company)' },
  { id: 'aiGovernance', name: 'AI governance team (company)' },
];
export const ROLE_IDS = ROLES.map(r => r.id);
export const TRIODIAN = ['methodOwner', 'recorder'];
export const BOARD = ['chair', 'director'];
/** Management's seats for AI (development plan phase 7): the technology owner (one person, usually the CIO) and the AI
 *  governance team (several). They supply the inventory and draft the measures. Neither proposes or records a position.
 *  Both are optional: an engagement with neither runs as before, with the CEO supplying the inventory. */
export const MANAGEMENT = ['technologyOwner', 'aiGovernance'];
/** Roles one active person holds at a time. Admin refuses a second. */
export const SINGLE_ROLES = ['technologyOwner'];
/** Who may propose a position at B2 to B8 (framework section 3.3). The CRO only in connected mode. */
export const PROPOSERS = ['chair', 'director', 'ceo', 'cro'];
export const STEPS = ['B0', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9'];
export const POSITION_STEPS = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'];

/** Summary for the Admin page: what each role may do. */
export const PERMISSIONS = [
  { what: 'Set-up: company, mode, areas, branding, board dates', roles: ['methodOwner', 'recorder'] },
  { what: 'GC agreement to the scope (B0)', roles: ['gc'] },
  { what: 'Chair agreement to the scope (B0)', roles: ['chair'] },
  { what: 'Record the management briefing as held, or as not needed (B0)', roles: ['advisor', 'gc', 'chair', 'methodOwner', 'recorder'] },
  { what: 'Confirm the management briefing as read (B0); own name only', roles: ['technologyOwner', 'aiGovernance'] },
  { what: 'AI inventory (B1): enter and maintain the lines', roles: ['aiGovernance', 'technologyOwner', 'ceo', 'methodOwner', 'recorder'] },
  { what: 'Confirm an inventory line (B1) or a draft measure (B7)', roles: ['technologyOwner'] },
  { what: 'Draft the measures the board will receive (B7); a director or the CEO proposes them', roles: ['aiGovernance', 'technologyOwner'] },
  { what: 'Record positions B2 to B8 (proposed by a director, the chair, the CEO or, connected, the CRO)', roles: ['chair', 'director', 'ceo', 'cro', 'methodOwner', 'recorder'] },
  { what: 'Questions to counsel', roles: ['advisor', 'gc', 'methodOwner', 'recorder', 'chair', 'director', 'ceo'] },
  { what: 'Answers from counsel', roles: ['gc'] },
  { what: 'Record the resolution (B9)', roles: ['chair'] },
  { what: 'Load the Atlas matter brief (B0)', roles: ['methodOwner', 'recorder'] },
  { what: 'Take the director briefing (B0); own answers only', roles: ['chair', 'director'] },
  { what: 'See every director’s briefing answers', roles: ['advisor', 'methodOwner', 'recorder'] },
];

/** The director briefing (B0, plan task 1.12). Directors take it; the board advisor and Triodian facilitate. */
export const BRIEFING_CHECKS = ['q1', 'q2', 'q3', 'q4'];
export const takesBriefing = roles => (roles || []).some(x => BOARD.includes(x));
export const facilitates = user => !!user && (user.isAdmin || (user.roles || []).some(x => x === 'advisor' || TRIODIAN.includes(x)));
/** Whether viewer may see the briefing answers of person personId: their own, or as a facilitator. */
export const seesAnswers = (viewer, personId) => !!viewer && (viewer.id === personId || facilitates(viewer));
/** A director's entry in the education record, from their answers and read confirmation. */
export function educationEntry(prev, answers, read, today) {
  const p = prev || {}, a = answers || {};
  const readOn = read ? (p.readOn || today) : '';
  const done = !!readOn && BRIEFING_CHECKS.every(q => typeof a[q] === 'string' && a[q]);
  return { readOn, completedOn: done ? (p.completedOn || today) : '' };
}

/** Resolved: the chair has recorded the resolution at B9. */
export const isResolved = S => !!(S && S.resolution && S.resolution.by);
/** The mode is fixed once the inventory has a line (framework section 2.1). */
export const modeLocked = S => !!(S && Array.isArray(S.inventory) && S.inventory.length);
const OPEN_WHEN_RESOLVED = new Set(['resolve', 'answer', 'boardView']);

/**
 * The app's rules. user: { id, roles[], isAdmin }. S: the stored engagement.
 * Returns '' when allowed, otherwise the reason, which the browser shows beside the disabled control.
 */
export function deny(target, user, S) {
  const r = k => (user.roles || []).includes(k), tri = TRIODIAN.some(r);
  const connected = !!(S && S.engagement && S.engagement.mode === 'connected');
  if (isResolved(S) && !OPEN_WHEN_RESOLVED.has(target)) return 'The board has resolved this engagement. Start the next review to make further changes.';
  switch (target) {
    case 'setup': return tri || user.isAdmin ? '' : 'Only Triodian or an administrator can change set-up.';
    case 'mode':
      if (!(tri || user.isAdmin)) return 'Only Triodian or an administrator can change set-up.';
      if (modeLocked(S)) return 'The mode is fixed once the AI inventory has a line. A company that becomes regulated starts a connected engagement.';
      return '';
    case 'agreeGC': return r('gc') ? '' : 'Only the GC can record the GC’s agreement to the scope.';
    case 'agreeChair': {
      // Where the GC also acts as counsel, the second agreement comes from a named executive or director (framework 3.1).
      const e = (S && S.engagement) || {};
      if (e.gcActsAsCounsel) return !e.secondApproverId ? 'Name the second approver in set-up first: the GC also acts as counsel.' : user.id === e.secondApproverId ? '' : 'The GC also acts as counsel, so the second agreement is recorded by the named second approver.';
      return r('chair') ? '' : 'Only the chair can record the chair’s agreement to the scope.';
    }
    case 'brief': return tri || user.isAdmin ? '' : 'Only Triodian or an administrator loads the matter brief.';
    case 'briefing': return r('chair') || r('director') ? '' : 'The director briefing is for the chair and directors.';
    case 'inventory': return r('ceo') || tri || MANAGEMENT.some(r) ? '' : 'Only the AI governance team, the technology owner, the CEO or Triodian can change the AI inventory.';
    case 'confirm': return r('technologyOwner') ? '' : 'Only the technology owner confirms an inventory line or a draft measure.';
    case 'draftMeasure':
      if (r('chair') || r('director') || r('ceo') || tri || MANAGEMENT.some(r) || (r('cro') && connected)) return '';
      return 'The measures are drafted by the AI governance team or the technology owner, and recorded by the board, the CEO or Triodian.';
    case 'mgmtBriefing': return tri || user.isAdmin || r('advisor') || r('gc') || r('chair') ? '' : 'The board advisor, the GC, the chair or Triodian records the management briefing.';
    case 'mgmtRead': return MANAGEMENT.some(r) ? '' : 'The management briefing is confirmed by the technology owner and the AI governance team.';
    case 'position':
      if (r('chair') || r('director') || r('ceo') || tri) return '';
      if (r('cro')) return connected ? '' : 'The CRO records positions in connected mode only.';
      return 'Positions are proposed by the board and management, and recorded by Triodian. The board advisor and the GC do not set them.';
    case 'ask': return ['advisor', 'gc', 'chair', 'director', 'ceo'].some(r) || tri ? '' : 'Only the board, the CEO, the board advisor, the GC or Triodian can raise a question to counsel.';
    case 'answer': return r('gc') ? '' : 'Only the GC answers questions to counsel.';
    case 'resolve': return r('chair') ? '' : 'Only the chair records the board’s resolution.';
    case 'directions': return r('chair') ? '' : 'Only the chair records the board directions.';
    case 'boardView': return tri || r('chair') || r('ceo') ? '' : 'Only Triodian, the chair or the CEO takes the board view for a meeting.';
  }
  return 'This change is not allowed.';
}

/** The management briefing (B0): held, or recorded as not needed with the reason, before the director briefing goes out. */
export const managementPeople = S => ((S && S.people) || []).filter(p => p.active !== false && (p.roles || []).some(x => MANAGEMENT.includes(x)));
export function managementBriefingState(S) {
  const m = (S && S.managementBriefing) || {}, ppl = managementPeople(S), c = m.confirmed || {};
  const held = !!m.heldOn, notNeeded = !held && !!String(m.notNeeded || '').trim();
  return { held, notNeeded, done: held || notNeeded, people: ppl, unconfirmed: held ? ppl.filter(p => !c[p.id]) : [] };
}

/** Whether a person may be named as the proposer of a position, given the engagement's mode. */
export function proposerError(personRoles, S) {
  const rs = personRoles || [];
  const connected = !!(S && S.engagement && S.engagement.mode === 'connected');
  if (['chair', 'director', 'ceo'].some(x => rs.includes(x))) return '';
  if (rs.includes('cro') && connected) return '';
  return 'A position is proposed by a director, the chair, the CEO or, in connected mode, the CRO.';
}
