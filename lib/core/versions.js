// Versions of the engagement, kept at each sign-off so later changes can be compared.
// The server adds them (lib/core/rbac.js); a browser cannot add, change or remove one.

/** What a version keeps: the areas, the positions B2 to B8, and the inventory line count. */
export function snapshotOf(d) {
  return { areas: (d.areas || []).map(a => a.name || a.id), positions: JSON.parse(JSON.stringify(d.positions || {})), inventoryLines: (d.inventory || []).length };
}

/** The sign-offs this save records: each one starts a new version. */
export function signOffs(o, n) {
  const sa = d => (d && d.scopeAgreed) || {}, res = d => (d && d.resolution) || {}, dir = d => (d && d.directions) || {};
  const out = [];
  if (sa(n).gcBy && sa(n).chairBy && !(sa(o).gcBy && sa(o).chairBy)) out.push('Scope agreed (B0)');
  if (dir(n).by && !dir(o).by) out.push('Board directions recorded');
  if (res(n).by && !res(o).by) out.push('Resolved by the board (B9)');
  return out;
}

/** Appends a version for each sign-off in this save. Keeps the stored versions; ignores any sent by the browser. */
export function withVersions(oldData, data, by, now) {
  const versions = ((oldData && oldData.versions) || []).slice();
  const labels = signOffs(oldData, data);
  if (labels.length) {
    const snap = snapshotOf(data);
    labels.forEach(label => versions.push({ id: 'V' + (versions.length + 1), label, at: now, by, snapshot: snap }));
  }
  data.versions = versions;
  return labels.length > 0;
}
