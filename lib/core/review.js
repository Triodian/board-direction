// The next review (B9 change events, or the review interval): keep the resolved engagement as a read-only record and
// start the next one from it. The company, mode, areas, people and inventory carry over as a starting point, marked
// "carried" until someone confirms them; the positions carry over as starting positions for the board to confirm.

const dLong = ymd => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd || ''); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)).toLocaleDateString('en-AU', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }) : (ymd || ''); };

export { isResolved } from './rules.js';

export const archiveLabel = data => {
  const e = data.engagement || {}, r = data.resolution || {};
  return `${e.company || 'Engagement'}${e.reference ? ' · ' + e.reference : ''} · resolved ${dLong(r.on)}`.trim();
};

/** A new engagement for the next review. */
export function nextReview(data, newId, actor, now, label) {
  const n = JSON.parse(JSON.stringify(data));
  n.engagement = { ...(n.engagement || {}), id: newId, reference: '', boardDates: {}, example: false, autosave: false };
  n.scopeAgreed = { gcBy: '', gcOn: '', chairBy: '', chairOn: '' };
  n.inventory = (n.inventory || []).map(x => ({ ...x, carried: true }));
  n.positions = Object.fromEntries(Object.entries(n.positions || {}).map(([k, v]) => [k, { ...v, carried: true }]));
  n.questions = []; n.resolution = {}; n.directions = {}; n.versions = []; n.education = {};
  n.previous = { label, resolvedOn: ((data.resolution || {}).on) || '' };
  n.history = [{ at: now, by: actor, action: 'nextReview', target: 'engagement', from: label, to: 'next review' }];
  return n;
}
