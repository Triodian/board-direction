// Best-practice baselines (development plan task BP.4): every baseline has a pack, a sector with no pack of its own
// gets its baseline in the sector's own order, and a pack for a public body names the accountable authority.
// Run: node tests/baselines.test.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as X from '../public/shared/sector.js';
const T = createRequire(import.meta.url)('../public/shared/terms.js');

let fails = 0; const ok = (label, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS' : 'FAIL') + ' · ' + label + (extra ? ' → ' + extra : '')); };
const C = JSON.parse(readFileSync(new URL('../public/bd-content.json', import.meta.url), 'utf8'));
const base = C.sectorPacks.filter(p => p.baseline);

ok('eight baseline packs', base.length === 8, base.map(p => p.id).join());
ok('every baseline pack suits both modes', base.every(p => p.mode === 'both'));
ok('public bodies name the accountable authority', base.filter(p => p.governingBody === 'accountableAuthority').map(p => p.id).sort().join() === 'bpCiGovernment,bpGovernment');
ok('baseline packs claim no entity type, so jurisdiction packs keep theirs', base.every(p => !(p.entityTypes || []).length));
ok('the sector list carries the baselines', C.regulatedSectors.some(s => (s.baselineProfiles || []).length));

const sug = (et, sector, mode = 'standalone') => (X.suggestPack(C, et, mode, sector) || {}).id;
ok('an Australian bank keeps its own pack', sug('authorisedDepositTakingInstitution', 'AU-BANKING', 'connected') === 'adi');
ok('a Singapore bank keeps the MAS pack', sug('', 'SG-BANKING', 'connected') === 'masFi');
ok('Australian health gets the health baseline', sug('healthServiceProvider', 'AU-HEALTH') === 'bpHealth');
ok('Australian critical infrastructure gets the corporate baseline first', sug('criticalInfrastructureAssetOwner', 'AU-CRITICAL-INFRASTRUCTURE') === 'bpCiCorporate');
ok('a life insurer with no pack of its own gets the insurance baseline', sug('lifeInsurer', 'AU-INSURANCE', 'connected') === 'bpInsurance');
ok('listed companies still get the general pack', sug('listedEntity', 'AU-LISTED') === 'general');
ok('governing body follows the pack', X.governingBodyOf(C, { mode: 'standalone', sectorPack: 'bpGovernment' }) === 'accountableAuthority' && X.governingBodyOf(C, { mode: 'standalone', sectorPack: 'general' }) === 'board');

// relabelling
const AA = 'accountableAuthority';
ok('board becomes accountable authority', T.relabel('The board resolves. Boards decide.', AA) === 'The accountable authority resolves. Accountable authorities decide.');
ok('"a board" takes "an"', T.relabel('Approved by a board.', AA) === 'Approved by an accountable authority.');
ok('the product name is kept', T.relabel('AI Board Direction: the board view', AA) === 'AI Board Direction: the accountable authority view');
ok('nothing changes for a board', T.relabel('The board resolves.', 'board') === 'The board resolves.');
ok('words containing board are left alone', T.relabel('dashboard and keyboard', AA) === 'dashboard and keyboard');
const ex = { toDocx: md => md }; T.wrapExport(ex, () => AA);
ok('exports are relabelled', ex.toDocx('Board minute') === 'Accountable authority minute');

console.log(fails ? `\n${fails} failure(s)` : '\nAll baseline checks pass');
process.exit(fails ? 1 : 0);
