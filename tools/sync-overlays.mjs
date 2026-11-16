// Builds a sector pack for each jurisdiction overlay in content/overlays/*.json (development plan task US.4; the
// Metamodel's docs/adding-a-jurisdiction.md, step J.4): the sector's best-practice baseline pack, plus the
// jurisdiction's failure cases and uses to consider ruling out. The areas stay the baseline's, so a direction reads the
// same in any jurisdiction. Run after sync-baselines: node tools/sync-overlays.mjs && node tools/build-content.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const dir = new URL('../content/overlays/', import.meta.url);
const file = new URL('../public/bd-content.json', import.meta.url);
const C = JSON.parse(readFileSync(file, 'utf8'));
const add = (a, b) => a.concat(b.filter(x => !a.includes(x)));
const built = [];
C.jurisdictionWording = C.jurisdictionWording || {};
for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  const O = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
  // The jurisdiction's own wording for text that names a law (US.7): the automated-decisions field, the worklist and
  // the question to counsel. Australia's and the neutral default stay in bd-content.json.
  if (O.wording) C.jurisdictionWording[O.jurisdiction] = O.wording;
  for (const o of O.packs) {
    const base = C.sectorPacks.find(p => p.baseline === o.baseline);
    if (!base) throw new Error(`${o.id}: no baseline pack for ${o.baseline}; run sync-baselines first`);
    const sector = (C.regulatedSectors || []).find(s => s.id === o.sector);
    if (!sector) throw new Error(`${o.id}: unknown sector ${o.sector}; run sync-sectors first`);
    built.push({
      id: o.id,
      name: o.name,
      mode: 'both',
      overlay: O.jurisdiction,
      builtOn: o.baseline,
      governingBody: base.governingBody,
      entityTypes: [],
      sectors: [o.sector],
      note: `Drafted for the ${sector.name.toLowerCase()} sector in ${O.jurisdiction === 'US' ? 'the United States' : O.jurisdiction}: the ${base.name.replace(/ \(best-practice baseline\)$/, '').toLowerCase()} baseline plus failure cases drawn from ${o.instruments}. Whether any of them applies is counsel's question; the matter brief lists the records.`,
      areas: base.areas,
      briefingHeading: base.briefingHeading,
      failures: add(base.failures, o.failures),
      redLineCandidates: add(base.redLineCandidates, o.redLineCandidates),
    });
  }
}
const ids = new Set(built.map(p => p.id));
C.sectorPacks = C.sectorPacks.filter(p => !p.overlay && !ids.has(p.id)).concat(built);
writeFileSync(file, JSON.stringify(C, null, 2) + '\n');
console.log(`${built.length} overlay packs: ${built.map(p => p.id).join(', ')}`);
