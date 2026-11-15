// Jurisdiction overlays (development plan task US.4; the Metamodel's adding-a-jurisdiction, step J.4): each US main
// sector opens with its pack, which is its baseline plus the US failure cases and uses to consider ruling out.
// Run: node tests/overlays.test.mjs
import { readFileSync } from 'node:fs';
import * as X from '../public/shared/sector.js';

let fails = 0; const ok = (label, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS' : 'FAIL') + ' · ' + label + (extra ? ' → ' + extra : '')); };
const C = JSON.parse(readFileSync(new URL('../public/bd-content.json', import.meta.url), 'utf8'));
const O = JSON.parse(readFileSync(new URL('../content/overlays/us.json', import.meta.url), 'utf8'));
const packs = C.sectorPacks.filter(p => p.overlay === 'US');
const main = C.regulatedSectors.filter(s => s.jurisdiction === 'US' && s.mainSector).map(s => s.id).sort();

ok('five US main sectors in the sector list', main.length === 5, main.join());
ok('one overlay pack for each US main sector', packs.map(p => p.sectors[0]).sort().join() === main.join(), packs.map(p => p.id).join());
for (const p of packs) {
  const base = C.sectorPacks.find(b => b.baseline === p.builtOn), o = O.packs.find(x => x.id === p.id);
  ok(`${p.id}: built on ${p.builtOn}, areas unchanged`, base && JSON.stringify(p.areas) === JSON.stringify(base.areas));
  ok(`${p.id}: keeps every baseline failure case and adds the US ones`, base.failures.every(f => p.failures.includes(f)) && o.failures.every(f => p.failures.includes(f)) && p.failures.length > base.failures.length);
  ok(`${p.id}: keeps the baseline's uses to rule out and adds the US ones`, base.redLineCandidates.every(r => p.redLineCandidates.includes(r)) && o.redLineCandidates.every(r => p.redLineCandidates.includes(r)));
  ok(`${p.id}: claims no entity type, suits both modes, names the board`, !p.entityTypes.length && p.mode === 'both' && p.governingBody === 'board');
  ok(`${p.id}: the note says counsel decides what applies`, /counsel's question/.test(p.note));
  ok(`${p.id}: no "must" or "required" in Triodian's words`, !/\b(must|required)\b/i.test([p.note, ...o.failures, ...o.redLineCandidates].join(' ')));
}

const sug = (et, sector, mode = 'connected') => (X.suggestPack(C, et, mode, sector) || {}).id;
ok('a US bank opens with the US banking pack', sug('bank', 'US-BANKING') === 'usBanking');
ok('a US insurer opens with the US insurance pack', sug('insurer', 'US-INSURANCE') === 'usInsurance');
ok('a US broker-dealer opens with the US securities pack', sug('capitalMarketsIntermediary', 'US-SECURITIES') === 'usSecurities');
ok('a US hospital opens with the US health pack, standalone too', sug('healthServiceProvider', 'US-HEALTH', 'standalone') === 'usHealth');
ok('a US critical infrastructure operator opens with the US pack', sug('criticalInfrastructureAssetOwner', 'US-CRITICAL-INFRASTRUCTURE', 'standalone') === 'usCriticalInfrastructure');
ok('US payments, with no overlay, gets the payments baseline', sug('paymentServiceProvider', 'US-PAYMENTS') === 'bpPayments');
ok('US listed companies get the general pack', sug('listedEntity', 'US-LISTED', 'standalone') === 'general');
ok('Australian and Singapore sectors are unchanged', sug('authorisedDepositTakingInstitution', 'AU-BANKING') === 'adi' && sug('', 'SG-BANKING') === 'masFi' && sug('healthServiceProvider', 'AU-HEALTH', 'standalone') === 'bpHealth');
ok('an Australian or Singapore engagement is not offered the US packs', X.packsFor(C, 'connected', 'AU').every(p => !p.overlay) && X.packsFor(C, 'standalone', 'SG').every(p => !p.overlay) && X.packsFor(C, 'standalone', 'US').filter(p => p.overlay).length === 5);
ok('a US pack set on an Australian engagement reads as general', X.packOf(C, { mode: 'connected', jurisdiction: 'AU', sectorPack: 'usBanking' }).id === 'general' && X.packOf(C, { mode: 'connected', jurisdiction: 'US', sectorPack: 'usBanking' }).id === 'usBanking');
ok('a US financial institution with no sector is not offered the MAS pack', X.suggestPack(C, 'financialInstitution', 'connected', '', 'US').id !== 'masFi' && X.suggestPack(C, 'financialInstitution', 'connected', '', 'SG').id === 'masFi');
ok('entity type labels name no jurisdiction', C.entityTypes.filter(([k]) => ['bank', 'insurer', 'capitalMarketsIntermediary', 'financialInstitution'].includes(k)).every(([, v]) => !/Singapore|MAS/.test(v)));
ok('a Singapore bank is not offered the US pack by its entity type', sug('bank', 'SG-BANKING') === 'masFi');

// the director briefing carries the US failure cases
const bs = X.briefingSections(C, { mode: 'connected', jurisdiction: 'US', sectorPack: 'usHealth' }), fs = bs.find(s => s.sector === 'usHealth');
ok('the director briefing lists the US health failure cases', fs && fs.list.some(f => /business associate agreement/.test(f)));
const bsAu = X.briefingSections(C, { mode: 'connected', jurisdiction: 'AU', sectorPack: 'usHealth' });
ok('a US pack left on an Australian engagement adds no US failure cases', !bsAu.some(s => s.sector === 'usHealth'));

console.log(fails ? `\n${fails} failed` : '\nAll passed');
process.exit(fails ? 1 : 0);
