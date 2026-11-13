// Copies the regulated sectors from the Triodian Metamodel (reference-data/regulated-sectors.json) into
// public/bd-content.json, so set-up offers the same sectors as the AI Obligations Atlas.
// Run: node tools/sync-sectors.mjs ../triodian_metamodel && node tools/build-content.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const mm = process.argv[2];
if (!mm) { console.error('Usage: node tools/sync-sectors.mjs <path to triodian_metamodel>'); process.exit(1); }
const ref = JSON.parse(readFileSync(join(mm, 'reference-data/regulated-sectors.json'), 'utf8'));
const version = readFileSync(join(mm, 'VERSION'), 'utf8').trim();
const items = Array.isArray(ref) ? ref : Object.values(ref).find(Array.isArray);
const file = new URL('../public/bd-content.json', import.meta.url);
const C = JSON.parse(readFileSync(file, 'utf8'));
C.regulatedSectorsSource = `Triodian Metamodel ${version}, reference-data/regulated-sectors.json`;
C.regulatedSectors = items.map(d => ({
  id: d.regulatedSectorID, jurisdiction: d.jurisdiction, name: d.name, entityTypes: d.entityTypes,
  ...(d.alsoReaches ? { alsoReaches: d.alsoReaches } : {}), financiallyRegulated: d.financiallyRegulated,
  ...(d.mainSector ? { mainSector: true } : {}), ...(d.baselineProfiles ? { baselineProfiles: d.baselineProfiles } : {}),
}));
writeFileSync(file, JSON.stringify(C, null, 2) + '\n');
console.log(`${C.regulatedSectors.length} regulated sectors from Metamodel ${version}`);
