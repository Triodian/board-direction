// Versions of the engagement (framework 9.4: a new version is issued at each sign-off). Shared by the server, which
// adds them (lib/core/versions.js), and the browser, which lists them and compares one with the engagement now.

/** What a version keeps: the areas, the positions B2 to B8, the inventory, and the resolution if recorded. */
export function snapshotOf(d) {
  const r = (d && d.resolution) || {};
  return {
    areas: ((d && d.areas) || []).map(a => a.name || a.id),
    positions: JSON.parse(JSON.stringify((d && d.positions) || {})),
    inventoryLines: ((d && d.inventory) || []).length,
    inventory: ((d && d.inventory) || []).map(l => l.id),
    resolution: r.by ? { on: r.on || '', minuteRef: r.minuteRef || '' } : null,
  };
}

const stable = v => Array.isArray(v) ? '[' + v.map(stable).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).filter(k => v[k] !== undefined && v[k] !== '').sort().map(k => k + ':' + stable(v[k])).join(',') + '}' : JSON.stringify(v === undefined ? null : v);
const STEP_NAMES = { B2: 'Posture and governance goals', B3: 'Red lines', B4: 'Reserved decisions', B5: 'Confidential information', B6: 'Harm not tolerated', B7: 'Reporting', B8: 'Accountability' };

/** What changed between a version's snapshot and another (usually now). Returns plain sentences, empty when the same. */
export function compareSnapshots(was, now) {
  const out = [], a = was || {}, b = now || {};
  const added = (b.areas || []).filter(x => !(a.areas || []).includes(x)), removed = (a.areas || []).filter(x => !(b.areas || []).includes(x));
  if (added.length) out.push(`Areas added: ${added.join(', ')}.`);
  if (removed.length) out.push(`Areas removed: ${removed.join(', ')}.`);
  const li = (b.inventory || []).filter(x => !(a.inventory || []).includes(x)), lo = (a.inventory || []).filter(x => !(b.inventory || []).includes(x));
  if (li.length || lo.length) out.push(`Inventory: ${a.inventoryLines || 0} lines then, ${b.inventoryLines || 0} now${li.length ? '; added ' + li.join(', ') : ''}${lo.length ? '; removed ' + lo.join(', ') : ''}.`);
  else if ((a.inventoryLines || 0) !== (b.inventoryLines || 0)) out.push(`Inventory: ${a.inventoryLines || 0} lines then, ${b.inventoryLines || 0} now.`);
  Object.keys(STEP_NAMES).forEach(k => {
    const x = (a.positions || {})[k], y = (b.positions || {})[k];
    if (stable(x || {}) !== stable(y || {})) out.push(`${k} ${STEP_NAMES[k]}: ${!x || !Object.keys(x).length ? 'recorded since' : !y || !Object.keys(y).length ? 'cleared since' : 'changed since'}.`);
  });
  if (!a.resolution && b.resolution) out.push('Resolved by the board since.');
  return out;
}

/** The version that records the resolution, if any. */
export const resolutionVersion = versions => [...(versions || [])].reverse().find(v => /Resolved/.test(v.label || '')) || null;
