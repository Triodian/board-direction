// Sector packs (development plan task 1.4; Board AI Appetite Framework, Appendix A and section 11.5).
// A pack gives three things: the starting areas of the business (connected mode uses the sector's functions, so each
// direction reads across to the AI Risk Appetite app), the sector's failure cases in the director briefing (B0),
// and the uses boards in that sector commonly consider at B3. Shared by the browser and the tests; no platform code.
// C is the content (bd-content.json); e is the engagement's details; S is the whole engagement.

/** Every pack that suits the mode. The general pack suits both. */
export function packsFor(C, mode) { return (C.sectorPacks || []).filter(p => p.mode === 'both' || p.mode === mode); }
/** The pack's areas; the general pack uses the framework's starting list. */
export function packAreas(C, p) { return p && Array.isArray(p.areas) ? p.areas : C.startingAreas; }
/** The engagement's pack, or the general pack when none is set or the one set does not suit the mode. */
export function packOf(C, e) {
  const list = packsFor(C, (e && e.mode) || 'standalone'), id = e && e.sectorPack;
  return list.find(p => p.id === id) || list.find(p => p.id === 'general') || list[0] || null;
}
/** The pack that fits the entity type, regulated domain and mode: a pack for the entity type, then one for the domain,
    otherwise the general pack. */
export function suggestPack(C, entityType, mode, domain) {
  const list = packsFor(C, mode || 'standalone');
  return list.find(p => entityType && (p.entityTypes || []).includes(entityType))
    || list.find(p => domain && (p.domains || []).includes(domain))
    || list.find(p => p.id === 'general') || list[0] || null;
}

/* Regulated domains (Triodian Metamodel reference data, copied into the content by tools/sync-domains.mjs).
   A domain belongs to one jurisdiction and narrows the entity types offered at set-up. */
/** The domains of a jurisdiction. */
export function domainsOf(C, jurisdiction) { return (C.regulatedDomains || []).filter(d => d.jurisdiction === jurisdiction); }
/** One domain by id, or null. */
export function domainById(C, id) { return (C.regulatedDomains || []).find(d => d.id === id) || null; }
/** The entity types set-up offers: the domain's own, or every type in the jurisdiction's domains; Other is always offered. */
export function entityTypesFor(C, jurisdiction, domain) {
  const d = domainById(C, domain), doms = d ? [d] : domainsOf(C, jurisdiction);
  const want = new Set(doms.flatMap(x => d ? x.entityTypes : x.entityTypes.concat(x.alsoReaches || [])).concat(['other']));
  return (C.entityTypes || []).filter(t => want.has(t[0]));
}
/** The mode a domain usually takes: connected for a financially regulated domain, otherwise standalone. */
export function modeFor(C, domain) { const d = domainById(C, domain); return d ? (d.financiallyRegulated ? 'connected' : 'standalone') : ''; }
/** Entity type ids renamed to the Metamodel's (2.4.0). Engagements saved before then are read with the new ids. */
export const ENTITY_RENAMED = { criticalInfrastructureAsset: 'criticalInfrastructureAssetOwner', defenceIndustry: 'defenceIndustrySupplier' };
/** True when an area is already used: a posture at B2 or an inventory line at B1 points at it by id. */
export function areasInUse(S) {
  const b2 = ((S && S.positions) || {}).B2 || {}, ids = new Set(((S && S.areas) || []).map(a => a.id));
  return Object.keys(b2).some(k => ids.has(k) && b2[k] && (b2[k].posture || b2[k].condition)) || ((S && S.inventory) || []).some(l => ids.has(l.area));
}
/** True when the areas are still the given pack's list, unchanged. */
export function areasMatch(C, S, p) {
  const want = packAreas(C, p), have = ((S && S.areas) || []).map(a => a.name);
  return want.length === have.length && want.every((n, i) => n === have[i]);
}
/** Replaces the areas with the pack's list. Refused, with the reason, once an area is in use. */
export function useAreas(C, S, p) {
  if (!p) return { error: 'Choose a sector pack first.' };
  if (areasInUse(S)) return { error: 'The current areas already carry postures (B2) or inventory lines (B1), so they are kept. Change them one by one instead.' };
  S.areas = packAreas(C, p).map((name, i) => ({ id: 'A' + (i + 1), name }));
  return { ok: true };
}
/** The briefing's sections, with the pack's failure cases after the general ones. */
export function briefingSections(C, e) {
  const p = packOf(C, e), base = (C.briefing && C.briefing.sections) || [];
  if (!p || !(p.failures || []).length) return base;
  const i = base.findIndex(s => /fails/i.test(s.h)), extra = { h: p.briefingHeading || ('Common failures: ' + p.name), list: p.failures, sector: p.id };
  return i < 0 ? base.concat([extra]) : base.slice(0, i + 1).concat([extra], base.slice(i + 1));
}
/** The uses boards commonly consider at B3: the pack's first, then the general list. */
export function redLineCandidates(C, e) {
  const p = packOf(C, e), base = (C.starting && C.starting.redLineCandidates) || [];
  return ((p && p.redLineCandidates) || []).concat(base.filter(x => !((p && p.redLineCandidates) || []).includes(x)));
}
