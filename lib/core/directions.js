// The board directions file, triodian.bd.directions.v1 (development plan task 3.4). In connected mode the board gives
// directions BD1 to BD7 before the AI risk appetite engagement; the AI Risk Appetite app reads them (task 3.5) and
// shows the relevant one on each decision. The file is built from the version the server kept when the chair
// recorded the directions, never from the engagement as it is being edited. Cloud-neutral: no platform code.

export const FORMAT = 'triodian.bd.directions.v1';
export const LABEL = 'Board directions recorded';
// The highest authority tier each posture accepts (Board AI Appetite Framework, Appendix B), as in public/bd-outputs.js.
export const POSTURE_MAX = { S1: 1, S2: 2, S3: 4, S4: 6 };

const lbl = (list, v) => { const r = (list || []).find(x => x[0] === v); return r ? r[1] : (v || ''); };
const tier = n => (n ? 'A' + n : null);

/** The latest version that recorded the directions, or null. */
export function recordedVersion(data) {
  const v = ((data && data.versions) || []).filter(x => x && x.label === LABEL && x.snapshot);
  return v.length ? v[v.length - 1] : null;
}

/** True while the directions are being revised: positions have changed since they were recorded. */
export function beingRevised(data) { return !!recordedVersion(data) && !((data.directions || {}).by); }

/**
 * The directions file from a recorded version. C is the content (public/bd-content.json).
 * Each direction names the Risk Appetite decisions it is read on.
 */
export function directionsFrom(version, C, data) {
  const s = version.snapshot, P = s.positions || {}, pos = k => P[k] || {}, SC = C.scales, e = s.engagement || {};
  const ids = s.areaIds || [], names = s.areas || [];
  const areas = ids.map((id, i) => {
    const x = pos('B2')[id] || {}, set = x.posture && x.posture !== 'NS';
    return { id, name: names[i] || id, posture: set ? x.posture : null, postureLabel: set ? lbl(SC.posture, x.posture) : 'Not set', maxTier: set ? tier(POSTURE_MAX[x.posture]) : null, condition: x.condition || '' };
  });
  const reserved = (pos('B4').events || []).map(x => ({ id: x.id, event: x.event || '', timing: x.timing || '', by: x.by || '' }));
  // The fast path (baseline control BC2) travels as one more event, so the directions format does not change.
  const fp = pos('B4').fastPath || {};
  if (String(fp.days || '').trim()) reserved.push({ id: 'FP', event: 'Fast path: a new AI use at A1 or A2 that reaches no BD5 threshold', timing: `Approved by management within ${String(fp.days).trim()} days; reported under the measures`, by: fp.by || 'CEO' });
  // The lowest tier the board reserves to itself before a use starts, read from the wording of B4 (for example "A new AI use at A3 (Decides) or above").
  const before = reserved.filter(x => /before/i.test(x.timing)).map(x => (/\bA([1-6])\b/.exec(x.event) || [])[1]).filter(Boolean).map(Number);
  const res = (data && data.resolution) || {};
  return {
    format: FORMAT,
    engagementId: e.id || '',
    company: e.company || '',
    jurisdiction: e.jurisdiction || '', sector: e.sector || '', entityType: e.entityType || '', sectorPack: e.sectorPack || '',
    version: version.id, recordedOn: version.at, recordedBy: version.by,
    status: res.by ? 'confirmed' : 'recorded',
    beingRevised: data ? beingRevised(data) : false,
    note: 'The board’s directions, as the chair recorded them. They are read on the AI risk appetite decisions named on each. A position there that goes past a direction cannot form part of the working appetite until a reason is recorded and the board revisits it.',
    directions: {
      BD1: { name: 'Posture by area', readOn: ['d1'], areas, goals: (pos('B2').goals || []).map(g => ({ id: g.id, goal: g.goal || '', owner: g.owner || '', measure: g.measure || '' })) },
      BD2: { name: 'Red lines', readOn: ['d1', 'd6'], lines: (pos('B3').lines || []).map(l => ({ id: l.id, use: l.use || '', scope: l.scope || 'All areas', appliesTo: l.appliesTo || '' })) },
      BD3: { name: 'Reserved decisions', readOn: ['d1', 'd4'], events: reserved, reservedFrom: before.length ? tier(Math.min(...before)) : null },
      BD4: { name: 'Confidential information', readOn: [], markings: { ...(pos('B5').cells || {}) }, conditions: (pos('B5').conditions || []).filter(Boolean) },
      BD5: { name: 'Harm not tolerated', readOn: ['d2'], harms: SC.harm.map(([h, name]) => { const v = (pos('B6').harms || {})[h] || {}; return { id: h, harmTo: name, notTolerated: v.statement || '', threshold: v.threshold || '' }; }) },
      BD6: { name: 'Reporting expected', readOn: ['d7'], measures: (pos('B7').measures || []).map(m => ({ id: m.id, measure: m.measure || '', limit: m.limit || '', owner: m.owner || '' })), events: (pos('B7').events || []).map(x => ({ id: x.id, event: x.event || '', to: x.to || '', within: x.within || '' })) },
      BD7: { name: 'Accountability', readOn: [], owners: SC.accountability.map(([a, name]) => ({ id: a, role: name, named: (pos('B8').owners || {})[a] || '' })) },
    },
  };
}

/** GET /api/board-directions: { status, body }. Only a connected engagement whose chair has recorded the directions has any. */
export function issuedDirections(data, C) {
  if (!data) return { status: 404, body: { error: 'There is no board engagement yet.' } };
  if ((data.engagement || {}).mode !== 'connected') return { status: 404, body: { error: 'This board engagement is standalone, so it gives no directions to an AI risk appetite engagement.' } };
  const v = recordedVersion(data);
  if (!v) return { status: 404, body: { error: 'The chair has not recorded the board directions yet.' } };
  return { status: 200, body: directionsFrom(v, C, data) };
}
