// Sector packs (development plan task 1.4): the content is sound, the pack fits the mode and entity type, the areas are
// swapped only while nothing points at them, and the briefing and B3 carry the sector's own cases.
// Run: node tests/sector.test.mjs
import { readFileSync } from 'node:fs';
import * as X from '../public/shared/sector.js';
import { structureError } from '../lib/core/rbac.js';

let fails = 0; const ok = (label, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS' : 'FAIL') + ' · ' + label + (extra ? ' → ' + extra : '')); };
const C = JSON.parse(readFileSync(new URL('../public/bd-content.json', import.meta.url), 'utf8'));
const types = new Set(C.entityTypes.map(t => t[0])), ids = C.sectorPacks.map(p => p.id);

// content
ok('pack ids are unique', new Set(ids).size === ids.length);
ok('there is a general pack for both modes', C.sectorPacks.some(p => p.id === 'general' && p.mode === 'both'));
for (const p of C.sectorPacks) {
  ok(`${p.id}: mode is standalone, connected or both`, ['standalone', 'connected', 'both'].includes(p.mode));
  ok(`${p.id}: entity types are known`, (p.entityTypes || []).every(t => types.has(t)), (p.entityTypes || []).filter(t => !types.has(t)).join());
  ok(`${p.id}: at least five areas, none repeated`, X.packAreas(C, p).length >= 5 && new Set(X.packAreas(C, p)).size === X.packAreas(C, p).length);
  ok(`${p.id}: says nothing about what the law requires`, !/law requires|legally required|must comply|complies with/i.test(JSON.stringify(p)));
}
const ins = C.sectorPacks.find(p => p.id === 'generalInsurer');
const ra = ['Underwriting and pricing', 'Claims', 'Fraud and investigations', 'Policy administration', 'Complaints and disputes', 'Customer communications', 'Finance and reserving', 'Legal and compliance', 'Technology operations'];
ok('the general insurer areas match the AI Risk Appetite functions', JSON.stringify(ins.areas) === JSON.stringify(ra));

// fit
ok('standalone offers only the general pack', X.packsFor(C, 'standalone').map(p => p.id).join() === 'general');
ok('connected offers every pack', X.packsFor(C, 'connected').length === C.sectorPacks.length);
ok('a general insurer is offered the general insurer pack', X.suggestPack(C, 'generalInsurer', 'connected').id === 'generalInsurer');
ok('an ADI is offered the ADI pack', X.suggestPack(C, 'authorisedDepositTakingInstitution', 'connected').id === 'adi');
ok('a MAS institution is offered the MAS pack', X.suggestPack(C, 'financialInstitution', 'connected').id === 'masFi');
ok('a type with no pack falls back to general', X.suggestPack(C, 'lifeInsurer', 'connected').id === 'general');
ok('a sector pack is not offered in standalone mode', X.suggestPack(C, 'generalInsurer', 'standalone').id === 'general');
ok('a pack that does not suit the mode reads as general', X.packOf(C, { mode: 'standalone', sectorPack: 'adi' }).id === 'general');
ok('no pack set reads as general', X.packOf(C, { mode: 'connected' }).id === 'general');

// areas
const fresh = () => ({ areas: C.startingAreas.map((name, i) => ({ id: 'A' + (i + 1), name })), positions: {}, inventory: [] });
let S = fresh();
ok('fresh areas match the general pack', X.areasMatch(C, S, X.packOf(C, { mode: 'connected' })) && !X.areasInUse(S));
ok('the ADI areas are swapped in', !X.useAreas(C, S, C.sectorPacks.find(p => p.id === 'adi')).error && S.areas[0].name === 'Retail lending and credit decisions' && S.areas[0].id === 'A1');
S = fresh(); S.positions.B2 = { goals: [{ id: 'GL1', goal: 'x' }], A2: { posture: 'S2' } };
ok('a posture at B2 keeps the areas', X.areasInUse(S) && !!X.useAreas(C, S, ins).error && S.areas[0].name === C.startingAreas[0]);
S = fresh(); S.positions.B2 = { goals: [{ id: 'GL1', goal: 'x' }] };
ok('goals alone do not hold the areas', !X.areasInUse(S));
S = fresh(); S.inventory = [{ id: 'L1', area: 'A3' }];
ok('an inventory line keeps the areas', X.areasInUse(S));

// briefing and B3
const secs = X.briefingSections(C, { mode: 'connected', sectorPack: 'generalInsurer' }), i = secs.findIndex(s => s.h === ins.briefingHeading);
ok('the pack’s failures follow the general ones in the briefing', i > 0 && /fails/i.test(secs[i - 1].h) && secs[i].list.length === ins.failures.length);
ok('the general pack adds no section', X.briefingSections(C, { mode: 'standalone', sectorPack: 'general' }).length === C.briefing.sections.length);
const cands = X.redLineCandidates(C, { mode: 'connected', sectorPack: 'adi' });
ok('B3 lists the pack’s uses first, then the general list', cands[0] === C.sectorPacks.find(p => p.id === 'adi').redLineCandidates[0] && cands.length === 2 + C.starting.redLineCandidates.length);

// the server refuses a malformed pack id
const base = { engagement: { mode: 'connected', practitioner: { firm: '', line: '' } }, areas: [], inventory: [], questions: [], history: [], versions: [] };
ok('the server takes a pack id', structureError({ ...base, engagement: { ...base.engagement, sectorPack: 'adi' } }) === '');
ok('the server refuses a malformed pack id', /sector pack/.test(structureError({ ...base, engagement: { ...base.engagement, sectorPack: '<script>' } })));

console.log(fails ? `\n${fails} failed` : '\nAll passed'); process.exit(fails ? 1 : 0);
