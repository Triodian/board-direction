// Copies the regulated domains from the Triodian Metamodel (reference-data/regulated-domains.json) into
// public/bd-content.json, so set-up offers the same domains as the AI Obligations Atlas.
// Run: node tools/sync-domains.mjs ../triodian_metamodel && node tools/build-content.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const mm = process.argv[2];
if (!mm) { console.error('Usage: node tools/sync-domains.mjs <path to triodian_metamodel>'); process.exit(1); }
const ref = JSON.parse(readFileSync(join(mm, 'reference-data/regulated-domains.json'), 'utf8'));
const version = readFileSync(join(mm, 'VERSION'), 'utf8').trim();
const items = Array.isArray(ref) ? ref : Object.values(ref).find(Array.isArray);
const file = new URL('../public/bd-content.json', import.meta.url);
const C = JSON.parse(readFileSync(file, 'utf8'));
C.regulatedDomainsSource = `Triodian Metamodel ${version}, reference-data/regulated-domains.json`;
C.regulatedDomains = items.map(d => ({
  id: d.regulatedDomainID, jurisdiction: d.jurisdiction, name: d.name, entityTypes: d.entityTypes,
  ...(d.alsoReaches ? { alsoReaches: d.alsoReaches } : {}), financiallyRegulated: d.financiallyRegulated,
}));
writeFileSync(file, JSON.stringify(C, null, 2) + '\n');
console.log(`${C.regulatedDomains.length} regulated domains from Metamodel ${version}`);
