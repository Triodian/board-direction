// The consistency checks BK1 to BK7 (Board AI Appetite Framework, section 10.1), run on the recorded positions before
// the outputs leave draft. Shared by the browser and the tests; plain JavaScript, no platform code.
// A failed check goes back to the CEO and the chair. Triodian does not resolve it, and the checks never stop the board
// resolving: they tell the board what is incomplete or inconsistent so it decides knowingly.

export const CLASSES = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'];
export const KINDS = ['K1', 'K2', 'K3', 'K4', 'K5', 'K7'];
export const HARMS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
export const OWNERS = ['AC1', 'AC2', 'AC3', 'AC4', 'AC5'];
/** Highest authority each posture accepts (framework 2.3 and 4.2): Avoid A1, Cautious A2, Open A4, Pursue A6. */
export const POSTURE_MAX = { S1: 1, S2: 2, S3: 4, S4: 6 };
const STRICT = { P: 1, C: 2, N: 3 };

export const CHECKS = [
  ['BK1', 'Complete', 'Every position is recorded, or recorded as not set with who will set it and by when.'],
  ['BK2', 'Ordered', 'In the confidential-information table, no marking loosens moving to a more sensitive class.'],
  ['BK3', 'Consistent', 'No area’s posture accepts a level of authority a red line rules out in that area, without a reason recorded.'],
  ['BK4', 'Testable', 'Every red line has been tested against the inventory.'],
  ['BK5', 'Owned', 'Every area, governance goal, measure and event has a named owner, and every goal a measure.'],
  ['BK6', 'Covered', 'Every inventory line that sees G3 to G6 information goes through a tool kind with a marking for that class.'],
  ['BK7', 'Referred', 'Every inventory line marked as deciding about individuals has a question to counsel.'],
];

/** Markings that loosen moving down a column: [{ g, k, above }]. */
export function loosened(cells) {
  const out = [];
  KINDS.forEach(k => { let prev = null; CLASSES.forEach(g => { const m = (cells || {})[g + ':' + k]; if (!m) return; if (prev && STRICT[m] < STRICT[prev.m]) out.push({ g, k, above: prev.g }); prev = { m, g }; }); });
  return out;
}

/**
 * Runs the seven checks. S: the engagement. labels (optional): { harm: {H1: name}, owners: {AC1: name} } for wording.
 * Returns [{ id, name, rule, ok, items: [{ step, text }] }].
 */
export function runChecks(S, labels = {}) {
  const P = (S && S.positions) || {}, areas = (S && S.areas) || [], inv = (S && S.inventory) || [], qs = (S && S.questions) || [];
  const pos = k => P[k] || {};
  const b2 = pos('B2'), lines = pos('B3').lines || [], rv = pos('B4').events || [], b5 = pos('B5'), harms = pos('B6').harms || {}, b7 = pos('B7'), owners = pos('B8').owners || {};
  const goals = b2.goals || [], measures = b7.measures || [], events = b7.events || [], cells = b5.cells || {};
  const hl = h => ((labels.harm || {})[h] ? `${h} ${labels.harm[h]}` : h), ol = a => ((labels.owners || {})[a] ? `${a} ${labels.owners[a]}` : a);
  const R = Object.fromEntries(CHECKS.map(c => [c[0], []]));
  const fail = (bk, step, text) => R[bk].push({ step, text });

  // BK1 Complete
  areas.forEach(a => {
    const x = b2[a.id] || {};
    if (!x.posture) fail('BK1', 'B2', `${a.name}: no posture recorded.`);
    else if (x.posture === 'NS') { if (!x.notSetOwner || !x.notSetBy) fail('BK1', 'B2', `${a.name}: not set, without who will set it and by when.`); }
    else if (!x.proposedBy) fail('BK1', 'B2', `${a.name}: posture has no proposer.`);
  });
  goals.forEach(g => { if (!String(g.goal || '').trim()) fail('BK1', 'B2', `${g.id}: the goal is blank.`); else if (!g.proposedBy) fail('BK1', 'B2', `${g.id}: no proposer.`); });
  lines.forEach(l => { if (!String(l.use || '').trim()) fail('BK1', 'B3', `${l.id}: the red line is blank.`); else if (!l.proposedBy) fail('BK1', 'B3', `${l.id}: no proposer.`); });
  if (!rv.length) fail('BK1', 'B4', 'No reserved decisions recorded. Without them the six starting events apply, with the board told after.');
  rv.forEach(x => { if (!String(x.event || '').trim()) fail('BK1', 'B4', `${x.id}: the event is blank.`); else { if (!String(x.timing || '').trim()) fail('BK1', 'B4', `${x.id}: before or after not recorded.`); if (!x.proposedBy) fail('BK1', 'B4', `${x.id}: no proposer.`); } });
  const blank = CLASSES.reduce((n, g) => n + KINDS.filter(k => !cells[g + ':' + k]).length, 0);
  if (blank) fail('BK1', 'B5', `${blank} of ${CLASSES.length * KINDS.length} cells of the confidential-information table not marked.`);
  if (blank < CLASSES.length * KINDS.length && !b5.proposedBy) fail('BK1', 'B5', 'The table has no proposer.');
  HARMS.forEach(h => { const v = harms[h] || {}; if (!String(v.statement || '').trim() && !String(v.threshold || '').trim()) fail('BK1', 'B6', `${hl(h)}: nothing recorded.`); else { if (!String(v.threshold || '').trim()) fail('BK1', 'B6', `${hl(h)}: no threshold.`); if (!v.proposedBy) fail('BK1', 'B6', `${hl(h)}: no proposer.`); } });
  if (!measures.length) fail('BK1', 'B7', 'No measures recorded.');
  measures.forEach(m => { if (!String(m.limit || '').trim()) fail('BK1', 'B7', `${m.id}: no limit.`); });
  events.forEach(x => { if (!String(x.within || '').trim()) fail('BK1', 'B7', `${x.id}: no time to report within.`); });
  if ((measures.length || events.length) && !b7.proposedBy) fail('BK1', 'B7', 'Reporting has no proposer.');
  ['AC1', 'AC3', 'AC5'].forEach(a => { if (!String(owners[a] || '').trim()) fail('BK1', 'B8', `${ol(a)}: not named.`); });
  if (Object.values(owners).some(v => String(v || '').trim()) && !pos('B8').proposedBy) fail('BK1', 'B8', 'Accountability has no proposer.');

  // BK2 Ordered
  loosened(cells).forEach(b => fail('BK2', 'B5', `${b.g} in ${b.k} is less strict than ${b.above} above it.`));

  // BK3 Consistent: a red line that names an authority level (A1 to A6) rules out that level in its scope
  lines.forEach(l => {
    const m = /\bA([1-6])\b/.exec(l.use || ''); if (!m) return;
    const lvl = +m[1], inScope = !l.scope || l.scope === 'All areas' ? areas : areas.filter(a => a.name === l.scope);
    inScope.forEach(a => { const x = b2[a.id] || {}; if (x.posture && POSTURE_MAX[x.posture] >= lvl && !String(x.condition || '').trim()) fail('BK3', 'B2', `${a.name}: the posture accepts A${lvl}, which ${l.id} rules out, and no condition records why.`); });
  });

  // BK4 Testable
  lines.forEach(l => {
    if (!String(l.use || '').trim()) return;
    if (String(l.use).trim().split(/\s+/).length < 4) fail('BK4', 'B3', `${l.id}: too short to test against an inventory line.`);
    if (!l.scope || !l.appliesTo) fail('BK4', 'B3', `${l.id}: scope or who it applies to not recorded.`);
    if (!l.testedAgainst) fail('BK4', 'B3', `${l.id}: not yet tested against the inventory.`);
    else if (l.testedAgainst !== 'none' && !inv.some(x => x.id === l.testedAgainst)) fail('BK4', 'B3', `${l.id}: tested against ${l.testedAgainst}, which is no longer in the inventory.`);
  });

  // BK5 Owned
  if (!String(owners.AC4 || '').trim()) fail('BK5', 'B8', 'Areas: no owner named for each area’s positions (AC4).');
  goals.forEach(g => { if (!String(g.owner || '').trim()) fail('BK5', 'B2', `${g.id}: no owner.`); if (!String(g.measure || '').trim()) fail('BK5', 'B2', `${g.id}: no measure.`); });
  measures.forEach(m => { if (!String(m.owner || '').trim()) fail('BK5', 'B7', `${m.id}: no owner.`); });
  events.forEach(x => { if (!String(x.to || '').trim()) fail('BK5', 'B7', `${x.id}: no one named to report to.`); });
  rv.forEach(x => { if (String(x.event || '').trim() && !String(x.by || '').trim()) fail('BK5', 'B4', `${x.id}: no one named to bring it.`); });

  // BK6 Covered
  inv.forEach(l => { if (['G3', 'G4', 'G5', 'G6'].includes(l.info) && KINDS.includes(l.kind) && !cells[l.info + ':' + l.kind]) fail('BK6', 'B5', `${l.id} sees ${l.info} through ${l.kind}, which has no marking.`); });

  // BK7 Referred
  inv.forEach(l => { if (l.adm && !qs.some(q => (q.lines || []).includes(l.id))) fail('BK7', 'B1', `${l.id} is marked as deciding about individuals but has no question to counsel.`); });

  return CHECKS.map(([id, name, rule]) => ({ id, name, rule, ok: !R[id].length, items: R[id] }));
}
