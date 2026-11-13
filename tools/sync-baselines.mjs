// Writes a sector pack for each best-practice baseline in the Triodian Metamodel (reference-data/baseline-profiles.json)
// into public/bd-content.json, after the jurisdiction packs (development plan task BP.4; docs/baselines.md there).
// A baseline pack suits both modes and is suggested for any sector that builds on it and has no pack of its own.
// Run: node tools/sync-baselines.mjs ../triodian_metamodel && node tools/build-content.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const mm = process.argv[2];
if (!mm) { console.error('Usage: node tools/sync-baselines.mjs <path to triodian_metamodel>'); process.exit(1); }
const read = f => JSON.parse(readFileSync(join(mm, f), 'utf8'));
const version = readFileSync(join(mm, 'VERSION'), 'utf8').trim();
const profiles = read('reference-data/baseline-profiles.json').items;
const sectors = read('reference-data/regulated-sectors.json').items;
const file = new URL('../public/bd-content.json', import.meta.url);
const C = JSON.parse(readFileSync(file, 'utf8'));
const sentence = s => (/[.!?]$/.test(s) ? s : s + '.');
const packId = id => 'bp' + id.replace(/^BP-/, '').toLowerCase().split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('');
const packs = profiles.map(p => ({
  id: packId(p.baselineProfileID),
  name: `${p.name} (best-practice baseline)`,
  mode: 'both',
  baseline: p.baselineProfileID,
  governingBody: p.governingBody,
  entityTypes: [],
  sectors: sectors.filter(s => (s.baselineProfiles || []).includes(p.baselineProfileID)).map(s => s.regulatedSectorID),
  note: `A best-practice baseline that holds in any jurisdiction, for ${p.description.toLowerCase()}, drawn from ${p.sources.filter(s => s.kind !== 'referenceProfile').map(s => s.issuer).filter((v, i, a) => a.indexOf(v) === i).join(', ')}. The jurisdiction's own obligations come from the matter brief.${p.governingBody === 'accountableAuthority' ? ' The app names the accountable authority where it would name the board.' : ''}`,
  areas: p.areas,
  briefingHeading: `Common failures: ${p.name.toLowerCase()}`,
  failures: p.failureCases.map(sentence),
  redLineCandidates: p.redLineCandidates,
}));
C.sectorPacks = (C.sectorPacks || []).filter(p => !p.baseline).concat(packs);
C.baselinesSource = `Triodian Metamodel ${version}, reference-data/baseline-profiles.json`;
writeFileSync(file, JSON.stringify(C, null, 2) + '\n');
console.log(`${packs.length} baseline packs from Metamodel ${version}: ${packs.map(p => p.id).join(', ')}`);
