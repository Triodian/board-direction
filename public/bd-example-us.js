/* AI Board Direction · the United States worked examples (development plan task US.5).
   Five fictional US organisations, one for each US main sector, each with every step B0 to B9 recorded and the board's
   resolution: a bank and an insurer in connected mode (the same two are the US worked examples in AI Risk Appetite and
   AI Use Assessment), and a broker-dealer, a health system and a transmission utility. Each opens with its US pack:
   the sector's best-practice baseline plus the US overlay. They run in the browser only and are never saved. The
   organisations, their people, providers and advisers are invented; any likeness to a real organisation is
   coincidence. Positions are illustrations of the method, not recommendations, and say nothing about what any law
   requires of a real organisation. */
(function () {
'use strict';
const P = (id, name, organisation, roles) => ({ id, name, organisation, roles, active: true });
const L = (id, use, tool, area, who, authority, info, kind, adm, owner, source, more) => Object.assign({ id, use, tool, area, who, authority, info, kind, adm, owner, source }, more || {});
// The confidentiality table every example starts from: P permitted, C with conditions, N not permitted.
const CELLS = {
  'G1:K1': 'P', 'G1:K2': 'P', 'G1:K3': 'P', 'G1:K4': 'P', 'G1:K5': 'P', 'G1:K7': 'P',
  'G2:K1': 'P', 'G2:K2': 'P', 'G2:K3': 'P', 'G2:K4': 'C', 'G2:K5': 'N', 'G2:K7': 'P',
  'G3:K1': 'P', 'G3:K2': 'C', 'G3:K3': 'C', 'G3:K4': 'N', 'G3:K5': 'N', 'G3:K7': 'C',
  'G4:K1': 'C', 'G4:K2': 'C', 'G4:K3': 'C', 'G4:K4': 'N', 'G4:K5': 'N', 'G4:K7': 'C',
  'G5:K1': 'C', 'G5:K2': 'C', 'G5:K3': 'N', 'G5:K4': 'N', 'G5:K5': 'N', 'G5:K7': 'C',
  'G6:K1': 'C', 'G6:K2': 'N', 'G6:K3': 'N', 'G6:K4': 'N', 'G6:K5': 'N', 'G6:K7': 'N',
};
const ADV = ['p-adv', 'Jordan Ellis', 'Northbeam Board Advisory'], REC = ['p-rec', 'Lee Chan', 'Triodian'];

/* Builds one example from its spec. Every example has the same shape as the Australian ones: people with the app's
   roles, a management briefing before the director briefing, an inventory supplied by the AI governance team and
   confirmed by the technology owner (all but one line), B2 to B8 proposed by the people who may propose, three
   questions to counsel, the directions recorded in their own version, and the resolution. */
function build(x) {
  const areas = x.areas.map((name, i) => ({ id: 'A' + (i + 1), name }));
  const S = {
    schema: 'triodian.bd.v1',
    engagement: {
      id: x.id, example: true, company: x.company, entityType: x.entityType, jurisdiction: 'US', sector: x.sector, mode: x.mode,
      reference: x.reference, privilegeMarking: 'Privileged and confidential · prepared at the request of counsel',
      practitioner: { firm: ADV[2], line: `Prepared by ${ADV[2]} using the Triodian method`, logo: TriodianBrand.EXAMPLE_LOGO },
      boardDates: x.boardDates, gcActsAsCounsel: false, secondApproverId: '', sectorPack: x.pack, managementReview: x.managementReview,
      matterBrief: x.brief,
    },
    areas,
    people: x.people.concat([P(ADV[0], ADV[1], ADV[2], ['advisor']), P(REC[0], REC[1], REC[2], ['methodOwner', 'recorder'])]),
    scopeAgreed: x.scopeAgreed,
    managementBriefing: { heldOn: x.briefing.heldOn, attended: `${ADV[1]}, ${x.briefing.gc} and ${REC[1]} with ${x.briefing.cio} and the AI governance team`, recordedBy: 'p-adv', notNeeded: '', confirmed: x.briefing.confirmed },
    education: x.education,
    inventory: x.inventory.map((l, i) => ({ ...l, suppliedBy: i % 2 ? 'p-aig2' : 'p-aig1', ...(l.id === x.unconfirmed ? {} : { confirmedBy: 'p-cio', confirmedOn: x.confirmedOn }) })),
    positions: {
      B2: Object.assign({ goals: x.goals }, x.postures),
      B3: { lines: x.lines },
      B4: { events: x.events },
      B5: { cells: Object.assign({}, CELLS), conditions: x.conditions, proposedBy: 'p-chair' },
      B6: { harms: x.harms },
      B7: {
        measures: x.measures.map(m => ({ ...m, draftedBy: m.id === 'BM6' ? 'p-aig2' : 'p-aig1', confirmedBy: 'p-cio', confirmedOn: x.measuresConfirmedOn })),
        events: x.reportEvents, proposedBy: 'p-chair',
      },
      B8: { owners: x.owners, proposedBy: 'p-chair' },
    },
    questions: x.questions,
    directions: { by: 'p-chair', on: x.directionsOn },
    resolution: { by: 'p-chair', on: x.boardDates.resolution, minuteRef: x.minuteRef, interval: 'Annual, with the board’s risk review', text: 'The board confirms the board directions BD1 to BD7 as recorded in steps B2 to B8' + (x.mode === 'connected' ? ', and approves the AI risk appetite statement prepared within them.' : ', and directs management to work within them.') },
    versions: [], previous: null, history: [],
  };
  const V = window.BDVersions, snapOf = d => (V && V.snapshotOf ? V.snapshotOf(d) : { areas: d.areas.map(a => a.name), positions: JSON.parse(JSON.stringify(d.positions)) });
  const chair = x.people.find(p => p.id === 'p-chair').name;
  S.versions = [
    { id: 'V1', label: 'Scope agreed (B0)', at: x.scopeAgreed.chairOn + 'T14:20:00Z', by: chair, snapshot: snapOf({ ...S, positions: {}, resolution: {} }) },
    { id: 'V2', label: 'Board directions recorded', at: x.directionsOn + 'T21:05:00Z', by: chair, snapshot: snapOf({ ...S, resolution: {} }) },
    { id: 'V3', label: 'Resolved by the board (B9)', at: x.boardDates.resolution + 'T20:30:00Z', by: chair, snapshot: snapOf(S) },
  ];
  return S;
}

// The measures every example reports (BM7 and BM8 are added by the example wrapper in bd-example.js).
const measures = (providers, by) => [
  { id: 'BM1', measure: 'AI uses in the inventory, and how many are new since the last report', limit: 'n/a', owner: 'CEO' },
  { id: 'BM2', measure: 'Uses that cross a red line or exceed their area’s posture without board approval', limit: '0', owner: 'CEO' },
  { id: 'BM3', measure: 'Material AI incidents', limit: '0', owner: 'CEO' },
  { id: 'BM4', measure: 'Known uses of information marked N in B5', limit: '0', owner: 'CEO' },
  { id: 'BM5', measure: 'Actions on the 90-day list overdue', limit: '2', owner: 'CEO' },
  { id: 'BM6', measure: `Material providers whose use of AI on ${providers} is not known`, limit: `0 by ${by}`, owner: 'CRO', goal: 'GL3' },
];
const reportEvents = who => [
  { id: 'EV1', event: 'A material AI incident', to: 'Chair', within: '24 hours' },
  { id: 'EV2', event: 'A red line crossed', to: 'Chair', within: '24 hours' },
  { id: 'EV3', event: `A regulator, ${who} or a provider raises AI use with the company`, to: 'Chair and GC', within: '2 business days' },
  { id: 'EV4', event: 'A provider changes the AI it uses for an area marked Avoid or Cautious', to: 'CRO', within: '10 business days' },
];
const reserved = (rv4, lead) => [
  { id: 'RV1', event: 'A new AI use at A3 (Decides) or above', timing: 'Before it starts', by: 'CEO', proposedBy: lead },
  { id: 'RV2', event: 'A new AI use in an area marked Avoid', timing: 'Before it starts', by: 'CEO', proposedBy: lead },
  { id: 'RV3', event: 'An exception to a red line', timing: 'Before it starts', by: 'CEO', proposedBy: 'p-dir1' },
  { id: 'RV4', event: rv4, timing: 'Before it starts, where the agreement allows; otherwise told at the next meeting', by: 'CRO', proposedBy: 'p-dir1' },
  { id: 'RV5', event: 'A material AI incident', timing: 'Told within 24 hours', by: 'CEO', proposedBy: 'p-dir2' },
  { id: 'RV6', event: 'A change to the directions or the measures', timing: 'Before it takes effect', by: 'Chair', proposedBy: lead },
];
const harms = (h1, h3, src1) => ({
  H1: { statement: h1[0], threshold: h1[1], source: src1, proposedBy: 'p-dir2' },
  H2: { statement: 'A staff member or applicant treated unfairly by AI', threshold: 'Any pattern across a hiring or review round', source: 'New', proposedBy: 'p-dir1' },
  H3: { statement: h3[0], threshold: h3[1], source: 'Operational risk incident thresholds', proposedBy: 'p-dir1' },
  H4: { statement: 'A critical operation stopped', threshold: 'Beyond its tolerance in the critical operations register', source: 'Critical operations register', proposedBy: 'p-ceo' },
  H5: { statement: 'A breach of a law, a license condition or a regulator’s order', threshold: 'Any', source: 'Compliance incident definitions', proposedBy: 'p-chair' },
  H6: { statement: 'A public failure attributed to our use of AI, or a provider’s', threshold: 'Any media or regulator attention', source: 'New', proposedBy: 'p-chair' },
});
const confirmed3 = (a, b, c) => ({ 'p-cio': a, 'p-aig1': b, 'p-aig2': c });

/* ---------- Harlow Ridge Bank: a New York state-chartered bank, connected mode ---------- */
function buildBank(brief) {
  return build({
    id: 'example-us-bank', company: 'Harlow Ridge Bank', entityType: 'bank', sector: 'US-BANKING', mode: 'connected', pack: 'usBanking', reference: 'HRB-BD-2026', brief,
    areas: ['Retail lending', 'Business lending', 'Deposits and payments', 'Fraud and financial crime', 'Markets and treasury', 'Customer service', 'Operations', 'Technology and security'],
    boardDates: { workshop: '2026-11-04', resolution: '2026-12-09' }, managementReview: '2026-12-16',
    people: [
      P('p-chair', 'Ruth Calloway', 'Harlow Ridge Bank (board)', ['chair']),
      P('p-dir1', 'Marcus Delgado', 'Harlow Ridge Bank (board, chair of the risk committee)', ['director']),
      P('p-dir2', 'Evelyn Park', 'Harlow Ridge Bank (board)', ['director']),
      P('p-ceo', 'Samuel Whitaker', 'Harlow Ridge Bank', ['ceo']),
      P('p-cro', 'Dana Whitcombe', 'Harlow Ridge Bank', ['cro']),
      P('p-gc', 'Michael Brandt', 'Harlow Ridge Bank', ['gc']),
      P('p-ret', 'Alicia Romero', 'Harlow Ridge Bank (head of consumer banking)', ['areaOwner']),
      P('p-fc', 'Grant Holloway', 'Harlow Ridge Bank (BSA/AML officer)', ['areaOwner']),
      P('p-coo', 'Priya Venkat', 'Harlow Ridge Bank (chief operating officer)', ['areaOwner']),
      P('p-cio', 'Kevin Marsh', 'Harlow Ridge Bank (chief information officer)', ['technologyOwner']),
      P('p-aig1', 'Tasha Greene', 'Harlow Ridge Bank (model risk and AI governance)', ['aiGovernance']),
      P('p-aig2', 'Owen Fitch', 'Harlow Ridge Bank (AI governance)', ['aiGovernance']),
    ],
    scopeAgreed: { gcBy: 'p-gc', gcOn: '2026-10-26', chairBy: 'p-chair', chairOn: '2026-10-27' },
    briefing: { heldOn: '2026-10-21', gc: 'Michael Brandt', cio: 'Kevin Marsh', confirmed: confirmed3('2026-10-21', '2026-10-22', '2026-10-22') },
    education: { 'p-chair': { readOn: '2026-10-28', completedOn: '2026-10-28' }, 'p-dir1': { readOn: '2026-10-29', completedOn: '2026-10-29' }, 'p-dir2': { readOn: '2026-11-02', completedOn: '' } },
    unconfirmed: 'L11', confirmedOn: '2026-10-29',
    inventory: [
      L('L1', 'Recommending approve, refer or decline on consumer loan applications to an underwriter', 'Vendor credit decision model (licensed)', 'A1', 'Staff', 'A2', 'G4', 'K2', true, 'p-ret', 'Credit policy, section 4, and the vendor’s model documentation', { decisions: 'Which applications are recommended for approval, referral or decline; an underwriter decides', personalInfo: 'Income, debts, credit report, employment and identity details' }),
      L('L2', 'Screening debit card and ACH payments for fraud, and declining those it scores above a threshold', 'The card processor’s fraud scoring service', 'A4', 'A provider for us', 'A3', 'G4', 'K2', true, 'p-fc', 'Card processing agreement, fraud services schedule', { decisions: 'Which card and ACH payments are declined at the point of sale or held', personalInfo: 'Account, card and merchant details, transaction history, device details' }),
      L('L3', 'Monitoring transactions and raising alerts for an analyst to review', 'Transaction monitoring system (licensed)', 'A4', 'Staff', 'A2', 'G4', 'K2', false, 'p-fc', 'BSA/AML program, section 7'),
      L('L4', 'Spreading business customers’ financial statements for relationship managers', 'Enterprise assistant (licensed)', 'A2', 'Staff', 'A1', 'G3', 'K1', false, 'p-ret', 'IT license list, 19 Oct'),
      L('L5', 'Answering customers’ general questions in the mobile app and on the website', 'Digital banking assistant', 'A6', 'Customers directly', 'A2', 'G4', 'K2', false, 'p-ret', 'Digital banking agreement, schedule 1'),
      L('L6', 'Summarizing contact-center calls and suggesting the next action to the agent', 'The contact-center platform', 'A6', 'A provider for us', 'A1', 'G4', 'K2', false, 'p-ret', 'Contact-center service description, 2026'),
      L('L7', 'Reconciling the general ledger and flagging breaks', 'The core banking provider’s reconciliation engine', 'A7', 'A provider for us', 'A4', 'G3', 'K2', false, 'p-coo', 'Core banking services agreement, schedule 4'),
      L('L8', 'Drafting emails, memos and board papers', 'Enterprise assistant (licensed)', 'A8', 'Staff', 'A1', 'G3', 'K1', false, 'p-cio', 'IT license list, 19 Oct'),
      L('L9', 'Transcribing meetings, including risk and credit committee meetings', 'Video-call platform AI notes', 'A8', 'Staff, including the credit committee', 'A1', 'G6', 'K3', false, 'p-cio', 'Interview with the CIO, 20 Oct'),
      L('L10', 'Suggesting and reviewing code for the online banking platform', 'Code assistant (licensed)', 'A8', 'Staff', 'A1', 'G2', 'K2', false, 'p-cio', 'IT license list, 19 Oct'),
      L('L11', 'Staff using consumer chatbots on their phones', 'Not known: any consumer tool', 'A8', 'Staff', 'A1', 'G6', 'K5', false, 'p-cio', 'Not known: CIO to survey by 20 Nov'),
    ],
    goals: [
      { id: 'GL1', goal: 'Use AI to stop more fraud and answer customers faster, without it standing in for a person where credit is declined or an account is closed', owner: 'Alicia Romero', measure: 'BM1: AI uses in the inventory, and how many are new since the last report', proposedBy: 'p-ceo' },
      { id: 'GL2', goal: 'No customer is declined, delayed or blocked unfairly because of AI: ours or a provider’s', owner: 'Priya Venkat', measure: 'BM3: material AI incidents', proposedBy: 'p-dir2' },
      { id: 'GL3', goal: 'Know what AI the card processor, the core banking provider and our other third parties use on our customers, and which of it our model risk program covers', owner: 'Dana Whitcombe', measure: 'BM6: material providers whose use of AI on customers is not known', proposedBy: 'p-dir1' },
    ],
    postures: {
      A1: { posture: 'S2', condition: 'An underwriter decides every decline', proposedBy: 'p-dir2' },
      A2: { posture: 'S2', condition: '', proposedBy: 'p-dir1' },
      A3: { posture: 'S3', condition: 'Within the payment limits in the core banking agreement; a person releases any held payment', proposedBy: 'p-ceo' },
      A4: { posture: 'S2', condition: 'A person decides before an account is closed or a report is filed', proposedBy: 'p-dir2' },
      A5: { posture: 'S2', condition: '', proposedBy: 'p-dir1' },
      A6: { posture: 'S3', condition: 'General information only; anything about a customer’s own account or complaint goes to a person', proposedBy: 'p-ceo' },
      A7: { posture: 'S3', condition: 'Within the reconciliation tolerances finance already works to', proposedBy: 'p-ceo' },
      A8: { posture: 'S2', condition: 'No AI holds credentials to production systems unattended', proposedBy: 'p-dir1' },
    },
    lines: [
      { id: 'RL1', use: 'A final credit decline or account closure that no person can review', scope: 'Retail lending; Business lending; Fraud and financial crime', appliesTo: 'The bank and its providers', testedAgainst: 'none', proposedBy: 'p-dir2' },
      { id: 'RL2', use: 'Generative or agentic AI acting on customer accounts with no owner under the model risk or third-party framework', scope: 'All areas', appliesTo: 'The bank and its providers', testedAgainst: 'none', proposedBy: 'p-dir1' },
      { id: 'RL3', use: 'Customer data used to train an external model', scope: 'All areas', appliesTo: 'The bank and its providers', testedAgainst: 'none', proposedBy: 'p-dir2' },
      { id: 'RL4', use: 'Board, credit committee or transaction information (G6) entered into any tool outside the bank’s own estate', scope: 'All areas', appliesTo: 'The bank and its advisers', testedAgainst: 'L11', proposedBy: 'p-chair' },
    ],
    events: reserved('The card processor or the core banking provider changing the AI it uses on customers’ payments or accounts', 'p-chair'),
    conditions: [
      'With conditions means: only in a tool the bank or a third party has under agreement, that does not train on customers’ information, and only for the people who already have access to it.',
      'Customers’ financial hardship and collections information (G5) goes only into a provider’s tool named in its agreement with the bank.',
      'Meeting AI may not run in board, risk committee or credit committee meetings.',
    ],
    harms: harms(['A customer wrongly declined credit, blocked from their money, or whose account is wrongly closed', 'Any single account wrongly closed; 25 or more customers for any other error'], ['A wrong payment, or a fraud loss the bank should have stopped', '$500,000 in a single event or $2 million in a quarter'], 'Consumer complaint and compliance incident definitions'),
    measures: measures('customers', '30 June 2027').concat([{ id: 'BM9', measure: 'Vendor models in use that have not been validated, or whose validation is overdue', limit: '0', owner: 'CRO' }]),
    measuresConfirmedOn: '2026-11-03', reportEvents: reportEvents('a customer'),
    owners: { AC1: 'Risk committee', AC2: 'Marcus Delgado', AC3: 'Samuel Whitaker, CEO', AC4: 'Each executive for their area', AC5: 'The CEO with the CRO, for up to 90 days, reported under BM2' },
    questions: [
      { ref: 'QC-01', step: 'B1', lines: ['L1', 'L2'], question: 'Lines L1 and L2 shape decisions about individual customers. What notice or explanation does the bank give customers about them, and does any state automated-decision law reach either?', status: 'answered', response: 'Calder & Whit LLP advised on 6 November: the adverse action notices the bank already sends cover L1; L2 is reviewed under the card processor’s agreement before the January renewal.', sentOn: '2026-10-28', respondedOn: '2026-11-06', raisedBy: 'p-rec' },
      { ref: 'QC-02', step: 'B3', question: 'Through which document can the bank hold the card processor to red line RL1, and does the agreement give an audit right that reaches the processor’s own model provider?', status: 'answered', response: 'Through the fraud services schedule, at the renewal on 1 January 2027. The current agreement gives an audit right over the processor only; the renewal adds one over its subcontractors.', sentOn: '2026-11-04', respondedOn: '2026-11-10', raisedBy: 'p-adv' },
      { ref: 'QC-03', step: 'B8', question: 'May the board leave these positions with the risk committee between reviews, or does anything the bank is subject to call for the full board to set them?', status: 'open', response: '', sentOn: '2026-11-04', raisedBy: 'p-gc' },
    ],
    directionsOn: '2026-11-11', minuteRef: 'Board minute 2026/12-07',
  });
}

/* ---------- Ashgrove Mutual Insurance Company: a property and casualty insurer, connected mode ---------- */
function buildInsurer(brief) {
  return build({
    id: 'example-us-insurer', company: 'Ashgrove Mutual Insurance Company', entityType: 'insurer', sector: 'US-INSURANCE', mode: 'connected', pack: 'usInsurance', reference: 'AMI-BD-2026', brief,
    areas: ['Distribution and sales', 'Underwriting', 'Pricing', 'Claims', 'Customer service', 'Reinsurance and capital', 'Investments', 'Technology'],
    boardDates: { workshop: '2026-11-10', resolution: '2026-12-15' }, managementReview: '2026-12-22',
    people: [
      P('p-chair', 'Harold Kessler', 'Ashgrove Mutual (board)', ['chair']),
      P('p-dir1', 'Simone Atwater', 'Ashgrove Mutual (board, chair of the risk committee)', ['director']),
      P('p-dir2', 'Luis Moreno', 'Ashgrove Mutual (board)', ['director']),
      P('p-ceo', 'Catherine Vance', 'Ashgrove Mutual', ['ceo']),
      P('p-cro', 'Benjamin Tran', 'Ashgrove Mutual', ['cro']),
      P('p-gc', 'Rebecca Sloane', 'Ashgrove Mutual', ['gc']),
      P('p-uw', 'Darnell Hayes', 'Ashgrove Mutual (chief underwriting officer)', ['areaOwner']),
      P('p-clm', 'Megan O’Rourke', 'Ashgrove Mutual (head of claims)', ['areaOwner']),
      P('p-act', 'Anil Kapoor', 'Ashgrove Mutual (chief actuary)', ['areaOwner']),
      P('p-cio', 'Laura Whitman', 'Ashgrove Mutual (chief information officer)', ['technologyOwner']),
      P('p-aig1', 'Isaac Burke', 'Ashgrove Mutual (AI governance)', ['aiGovernance']),
      P('p-aig2', 'Nadia Hollis', 'Ashgrove Mutual (AI governance)', ['aiGovernance']),
    ],
    scopeAgreed: { gcBy: 'p-gc', gcOn: '2026-11-02', chairBy: 'p-chair', chairOn: '2026-11-03' },
    briefing: { heldOn: '2026-10-28', gc: 'Rebecca Sloane', cio: 'Laura Whitman', confirmed: confirmed3('2026-10-28', '2026-10-29', '2026-10-29') },
    education: { 'p-chair': { readOn: '2026-11-04', completedOn: '2026-11-04' }, 'p-dir1': { readOn: '2026-11-05', completedOn: '2026-11-05' }, 'p-dir2': { readOn: '2026-11-09', completedOn: '' } },
    unconfirmed: 'L11', confirmedOn: '2026-11-05',
    inventory: [
      L('L1', 'Scoring new homeowners applications and referring those above a threshold to an underwriter', 'Underwriting rules engine with a vendor risk model', 'A2', 'Staff', 'A2', 'G4', 'K2', true, 'p-uw', 'Underwriting guidelines, section 3, and the vendor’s model documentation', { decisions: 'Which applications are accepted on the rules, and which go to an underwriter', personalInfo: 'Property details, claims history, insurance score and identity details' }),
      L('L2', 'Using external property and consumer data to rate auto and homeowners policies', 'The rating vendor’s data and model service', 'A3', 'A provider for us', 'A3', 'G4', 'K7', true, 'p-act', 'Rating services agreement, schedule 2, and the filed rating plans', { decisions: 'The rating factors applied to each policy', personalInfo: 'Property, vehicle and driving data; consumer data the vendor supplies' }),
      L('L3', 'Triaging first notice of loss and routing claims to fast-track or an adjuster', 'Claims platform triage model', 'A4', 'Staff', 'A3', 'G4', 'K2', true, 'p-clm', 'Claims procedures manual, part 2', { decisions: 'Which claims are fast-tracked for payment and which go to an adjuster', personalInfo: 'Claimant details, loss description, photos, policy history' }),
      L('L4', 'Estimating auto repair costs from photos for the adjuster', 'The independent appraisal firm’s estimating tool', 'A4', 'A provider for us', 'A2', 'G4', 'K2', false, 'p-clm', 'Appraisal services agreement, 2025'),
      L('L5', 'Flagging claims for the special investigations unit', 'Fraud detection service (licensed)', 'A4', 'Staff', 'A2', 'G4', 'K2', false, 'p-clm', 'SIU procedures, section 4'),
      L('L6', 'Answering policyholders’ general questions on the website', 'Website assistant', 'A5', 'Customers directly', 'A2', 'G4', 'K2', false, 'p-uw', 'Digital services agreement, schedule 1'),
      L('L7', 'Pricing guidance for independent agents in the agency portal', 'The agency portal’s quoting assistant', 'A1', 'A provider for us', 'A1', 'G3', 'K2', false, 'p-uw', 'Agency portal agreement, 2026'),
      L('L8', 'Drafting emails, reports and board papers', 'Enterprise assistant (licensed)', 'A8', 'Staff', 'A1', 'G3', 'K1', false, 'p-cio', 'IT license list, 26 Oct'),
      L('L9', 'Transcribing meetings, including risk committee meetings', 'Video-call platform AI notes', 'A8', 'Staff, including the risk committee', 'A1', 'G6', 'K3', false, 'p-cio', 'Interview with the CIO, 27 Oct'),
      L('L10', 'Modeling catastrophe exposure for reinsurance buying', 'The reinsurance broker’s catastrophe model', 'A6', 'An adviser for us', 'A2', 'G3', 'K7', false, 'p-act', 'Reinsurance broker engagement letter'),
      L('L11', 'Staff using consumer chatbots on their phones', 'Not known: any consumer tool', 'A8', 'Staff', 'A1', 'G6', 'K5', false, 'p-cio', 'Not known: CIO to survey by 27 Nov'),
    ],
    goals: [
      { id: 'GL1', goal: 'Use AI to settle straightforward claims faster, without it standing in for a person where a claim is denied or a policyholder is suspected of fraud', owner: 'Megan O’Rourke', measure: 'BM1: AI uses in the inventory, and how many are new since the last report', proposedBy: 'p-ceo' },
      { id: 'GL2', goal: 'No policyholder is priced, delayed or denied unfairly because of AI or the external data behind it', owner: 'Anil Kapoor', measure: 'BM3: material AI incidents', proposedBy: 'p-dir2' },
      { id: 'GL3', goal: 'Know what AI the rating vendor, the appraisal firm and our other providers use on our policyholders, and hold audit and cooperation terms with each', owner: 'Benjamin Tran', measure: 'BM6: material providers whose use of AI on policyholders is not known', proposedBy: 'p-dir1' },
    ],
    postures: {
      A1: { posture: 'S3', condition: 'Guidance to agents only; the agent quotes from the filed rates', proposedBy: 'p-ceo' },
      A2: { posture: 'S2', condition: 'An underwriter decides every declination', proposedBy: 'p-dir2' },
      A3: { posture: 'S2', condition: 'Only rating factors in a filed rating plan, each tested for unfair discrimination before use', proposedBy: 'p-dir2' },
      A4: { posture: 'S2', condition: 'A person decides every denial, and whether a claim is referred as suspected fraud', proposedBy: 'p-dir1' },
      A5: { posture: 'S3', condition: 'General information only; anything about a policyholder’s own claim or cover goes to a person', proposedBy: 'p-ceo' },
      A6: { posture: 'S2', condition: '', proposedBy: 'p-dir1' },
      A7: { posture: 'S2', condition: '', proposedBy: 'p-dir1' },
      A8: { posture: 'S3', condition: 'No AI holds credentials to production systems unattended', proposedBy: 'p-ceo' },
    },
    lines: [
      { id: 'RL1', use: 'An adverse underwriting, pricing or claims decision made by AI that no person can review', scope: 'Underwriting; Pricing; Claims', appliesTo: 'The insurer and its providers', testedAgainst: 'none', proposedBy: 'p-dir2' },
      { id: 'RL2', use: 'Pricing on data the policyholder did not provide and cannot see', scope: 'Pricing', appliesTo: 'The insurer and its rating vendors', testedAgainst: 'none', proposedBy: 'p-dir2' },
      { id: 'RL3', use: 'Health or genetic data in models outside the insurer’s control', scope: 'All areas', appliesTo: 'The insurer and its providers', testedAgainst: 'none', proposedBy: 'p-dir1' },
      { id: 'RL4', use: 'Board, risk committee or reserving information (G6) entered into any tool outside the insurer’s own estate', scope: 'All areas', appliesTo: 'The insurer and its advisers', testedAgainst: 'L11', proposedBy: 'p-chair' },
    ],
    events: reserved('The rating vendor or the appraisal firm changing the AI or the external data it uses on policyholders’ premiums or claims', 'p-chair'),
    conditions: [
      'With conditions means: only in a tool the insurer or a provider has under agreement, that does not train on policyholders’ information, and only for the people who already have access to it.',
      'Policyholders’ health and injury information (G5) goes only into a provider’s tool named in its agreement with the insurer.',
      'Meeting AI may not run in board or risk committee meetings.',
    ],
    harms: harms(['A policyholder wrongly denied, delayed, charged or paid', 'Any single claim wrongly denied; 10 or more policyholders for any other error'], ['A wrong claim payment or a premium charged in error', '$250,000 in a single event or $1 million in a quarter'], 'Complaint and market conduct incident definitions'),
    measures: measures('policyholders', '30 June 2027').concat([{ id: 'BM9', measure: 'External data sources and rating models in use without a current test for unfair discrimination', limit: '0', owner: 'CRO' }]),
    measuresConfirmedOn: '2026-11-09', reportEvents: reportEvents('a policyholder'),
    owners: { AC1: 'Risk committee', AC2: 'Simone Atwater', AC3: 'Catherine Vance, CEO', AC4: 'Each executive for their area', AC5: 'The CEO with the CRO, for up to 90 days, reported under BM2' },
    questions: [
      { ref: 'QC-01', step: 'B1', lines: ['L1', 'L2', 'L3'], question: 'Lines L1 to L3 shape decisions about individual policyholders. In the states where Ashgrove writes business, which have issued the model bulletin on AI systems, and what does each expect of a written AI program?', status: 'answered', response: 'Calder & Whit LLP advised on 12 November: five of the seven states where Ashgrove writes have issued it; the program the CRO drafted covers all seven, with a note of the differences.', sentOn: '2026-11-04', respondedOn: '2026-11-12', raisedBy: 'p-rec' },
      { ref: 'QC-02', step: 'B3', question: 'Does the rating services agreement give Ashgrove the audit and cooperation rights red line RL2 depends on, and when can it next be changed?', status: 'answered', response: 'It gives an audit right but no duty to cooperate with a regulator’s inquiry. The amendment the vendor has agreed adds it from 1 March 2027.', sentOn: '2026-11-10', respondedOn: '2026-11-16', raisedBy: 'p-adv' },
      { ref: 'QC-03', step: 'B8', question: 'May the board leave these positions with the risk committee between reviews, or does anything the insurer is subject to call for the full board to set them?', status: 'open', response: '', sentOn: '2026-11-10', raisedBy: 'p-gc' },
    ],
    directionsOn: '2026-11-17', minuteRef: 'Board minute 2026/12-11',
  });
}

/* ---------- Quillfield Securities: a broker-dealer and investment adviser, connected mode ---------- */
function buildSecurities(brief) {
  return build({
    id: 'example-us-securities', company: 'Quillfield Securities LLC', entityType: 'capitalMarketsIntermediary', sector: 'US-SECURITIES', mode: 'connected', pack: 'usSecurities', reference: 'QS-BD-2026', brief,
    areas: ['Advice and recommendations', 'Client communications', 'Trading and execution', 'Research', 'Portfolio management', 'Compliance and surveillance', 'Operations'],
    boardDates: { workshop: '2026-11-12', resolution: '2026-12-10' }, managementReview: '2026-12-17',
    people: [
      P('p-chair', 'Victoria Langford', 'Quillfield Securities (board)', ['chair']),
      P('p-dir1', 'Elliot Nash', 'Quillfield Securities (board, chair of the audit and risk committee)', ['director']),
      P('p-dir2', 'Grace Oyelaran', 'Quillfield Securities (board)', ['director']),
      P('p-ceo', 'Daniel Cho', 'Quillfield Securities', ['ceo']),
      P('p-cro', 'Hannah Becker', 'Quillfield Securities (chief risk officer)', ['cro']),
      P('p-gc', 'Patrick Moynihan', 'Quillfield Securities', ['gc']),
      P('p-wm', 'Sofia Alvarez', 'Quillfield Securities (head of wealth management)', ['areaOwner']),
      P('p-cco', 'Terrence Boyd', 'Quillfield Securities (chief compliance officer)', ['areaOwner']),
      P('p-cio', 'Julia Kwan', 'Quillfield Securities (chief technology officer)', ['technologyOwner']),
      P('p-aig1', 'Ryan Patel', 'Quillfield Securities (AI governance)', ['aiGovernance']),
      P('p-aig2', 'Monica Ruiz', 'Quillfield Securities (AI governance)', ['aiGovernance']),
    ],
    scopeAgreed: { gcBy: 'p-gc', gcOn: '2026-11-03', chairBy: 'p-chair', chairOn: '2026-11-04' },
    briefing: { heldOn: '2026-10-30', gc: 'Patrick Moynihan', cio: 'Julia Kwan', confirmed: confirmed3('2026-10-30', '2026-11-02', '2026-11-02') },
    education: { 'p-chair': { readOn: '2026-11-05', completedOn: '2026-11-05' }, 'p-dir1': { readOn: '2026-11-06', completedOn: '2026-11-06' }, 'p-dir2': { readOn: '2026-11-10', completedOn: '' } },
    unconfirmed: 'L10', confirmedOn: '2026-11-06',
    inventory: [
      L('L1', 'Suggesting portfolio rebalancing trades to financial advisors for client accounts', 'Portfolio rebalancing tool (licensed)', 'A1', 'Staff', 'A2', 'G4', 'K2', true, 'p-wm', 'Advisory program manual, section 5', { decisions: 'Which trades are suggested for each client account; the advisor decides and the client approves', personalInfo: 'Holdings, risk profile, investment objectives, tax status' }),
      L('L2', 'Drafting client emails and meeting follow-ups for advisors to review and send', 'Enterprise assistant (licensed)', 'A2', 'Staff', 'A1', 'G4', 'K1', false, 'p-wm', 'IT license list, 28 Oct'),
      L('L3', 'Routing client orders across venues', 'The clearing firm’s smart order router', 'A3', 'A provider for us', 'A4', 'G3', 'K2', false, 'p-cco', 'Clearing agreement, schedule 3'),
      L('L4', 'Reviewing advisors’ emails and chats for supervision and flagging those for a principal', 'Communications surveillance service (licensed)', 'A6', 'Staff', 'A2', 'G4', 'K2', false, 'p-cco', 'Written supervisory procedures, chapter 11'),
      L('L5', 'Monitoring trades for manipulation and insider dealing alerts', 'The clearing firm’s trade surveillance model', 'A6', 'A provider for us', 'A2', 'G4', 'K2', false, 'p-cco', 'Clearing agreement, schedule 5'),
      L('L6', 'Summarizing research reports for advisors', 'The research provider’s assistant', 'A4', 'A provider for us', 'A1', 'G2', 'K2', false, 'p-wm', 'Research subscription terms, 2026'),
      L('L7', 'An agent that opens accounts, collects documents and completes suitability questionnaires with clients online', 'Digital onboarding agent (pilot)', 'A7', 'Customers directly', 'A3', 'G4', 'K2', true, 'p-wm', 'Pilot statement of work, 1 Oct', { decisions: 'Whether an application is complete and passes the firm’s identity checks; an operations associate approves each account', personalInfo: 'Identity documents, financial situation, investment experience' }),
      L('L8', 'Transcribing meetings, including client review and committee meetings', 'Video-call platform AI notes', 'A2', 'Staff, including the risk committee', 'A1', 'G6', 'K3', false, 'p-cio', 'Interview with the CTO, 29 Oct'),
      L('L9', 'Suggesting and reviewing code for the client portal', 'Code assistant (licensed)', 'A7', 'Staff', 'A1', 'G2', 'K2', false, 'p-cio', 'IT license list, 28 Oct'),
      L('L10', 'Staff using consumer chatbots on their phones', 'Not known: any consumer tool', 'A2', 'Staff', 'A1', 'G6', 'K5', false, 'p-cio', 'Not known: CTO to survey by 27 Nov'),
    ],
    goals: [
      { id: 'GL1', goal: 'Use AI to give advisors more time with clients, inside the firm’s written supervisory procedures', owner: 'Sofia Alvarez', measure: 'BM1: AI uses in the inventory, and how many are new since the last report', proposedBy: 'p-ceo' },
      { id: 'GL2', goal: 'No client receives a recommendation or communication from AI that a supervisor has not had the chance to review', owner: 'Terrence Boyd', measure: 'BM3: material AI incidents', proposedBy: 'p-dir2' },
      { id: 'GL3', goal: 'Know what AI the clearing firm and our other service providers use on our clients and their information', owner: 'Hannah Becker', measure: 'BM6: material providers whose use of AI on clients is not known', proposedBy: 'p-dir1' },
    ],
    postures: {
      A1: { posture: 'S2', condition: 'An advisor decides every recommendation, and the client approves every trade', proposedBy: 'p-dir2' },
      A2: { posture: 'S2', condition: 'Every communication to a client is reviewed as the written supervisory procedures set', proposedBy: 'p-dir2' },
      A3: { posture: 'S3', condition: 'Within the best-execution policy and the limits in the clearing agreement', proposedBy: 'p-ceo' },
      A4: { posture: 'S3', condition: '', proposedBy: 'p-ceo' },
      A5: { posture: 'S2', condition: '', proposedBy: 'p-dir1' },
      A6: { posture: 'S2', condition: 'A principal decides every escalation', proposedBy: 'p-dir1' },
      A7: { posture: 'S2', condition: 'An operations associate approves every new account', proposedBy: 'p-dir1' },
    },
    lines: [
      { id: 'RL1', use: 'Advice sent to retail clients with no advisor review', scope: 'Advice and recommendations; Client communications', appliesTo: 'The firm and its providers', testedAgainst: 'none', proposedBy: 'p-dir2' },
      { id: 'RL2', use: 'An AI agent placing trades or moving customer assets outside a scope a supervisor has approved', scope: 'Trading and execution; Operations', appliesTo: 'The firm and its providers', testedAgainst: 'none', proposedBy: 'p-dir1' },
      { id: 'RL3', use: 'Client communications generated with no record of the prompt', scope: 'Client communications', appliesTo: 'The firm', testedAgainst: 'none', proposedBy: 'p-dir2' },
      { id: 'RL4', use: 'Board, risk committee or deal information (G6) entered into any tool outside the firm’s own estate', scope: 'All areas', appliesTo: 'The firm and its advisers', testedAgainst: 'L10', proposedBy: 'p-chair' },
    ],
    events: reserved('The clearing firm changing the AI it uses on our clients’ orders or surveillance', 'p-chair'),
    conditions: [
      'With conditions means: only in a tool the firm or a service provider has under agreement, that does not train on clients’ information, and only for the people who already have access to it.',
      'Clients’ identity documents and account numbers (G5) go only into a provider’s tool named in its agreement with the firm.',
      'Meeting AI may not run in board or committee meetings.',
    ],
    harms: harms(['A client given an unsuitable recommendation, or an order executed wrongly', 'Any single unsuitable recommendation acted on; 10 or more clients for any other error'], ['A trading error or a loss to the firm', '$250,000 in a single event or $1 million in a quarter'], 'Customer complaint and trade error definitions'),
    measures: measures('clients', '30 June 2027'),
    measuresConfirmedOn: '2026-11-10', reportEvents: reportEvents('a client'),
    owners: { AC1: 'Audit and risk committee', AC2: 'Elliot Nash', AC3: 'Daniel Cho, CEO', AC4: 'Each executive for their area', AC5: 'The CEO with the CRO and the CCO, for up to 90 days, reported under BM2' },
    questions: [
      { ref: 'QC-01', step: 'B1', lines: ['L1', 'L7'], question: 'Lines L1 and L7 shape decisions about individual clients. How do the written supervisory procedures need to describe the rebalancing tool and the onboarding agent, and who supervises each?', status: 'answered', response: 'Calder & Whit LLP advised on 13 November: the procedures name the branch principal for L1 and the operations principal for L7, with the agent’s scope set out in writing.', sentOn: '2026-11-05', respondedOn: '2026-11-13', raisedBy: 'p-rec' },
      { ref: 'QC-02', step: 'B3', question: 'Does the clearing agreement oblige the clearing firm to tell Quillfield of a breach of client information within 72 hours, as red line RL2 and the incident response program assume?', status: 'answered', response: 'It sets 72 hours for systems the clearing firm maintains for Quillfield, but not for its own subcontractors; the amendment signed on 18 November closes that gap.', sentOn: '2026-11-12', respondedOn: '2026-11-18', raisedBy: 'p-adv' },
      { ref: 'QC-03', step: 'B8', question: 'May the board leave these positions with the audit and risk committee between reviews?', status: 'open', response: '', sentOn: '2026-11-12', raisedBy: 'p-gc' },
    ],
    directionsOn: '2026-11-19', minuteRef: 'Board minute 2026/12-04',
  });
}

/* ---------- Fernhollow Health: a nonprofit health system, standalone mode ---------- */
function buildHealth(brief) {
  return build({
    id: 'example-us-health', company: 'Fernhollow Health', entityType: 'healthServiceProvider', sector: 'US-HEALTH', mode: 'standalone', pack: 'usHealth', reference: 'FH-BD-2026', brief,
    areas: ['Clinical care', 'Diagnostics', 'Patient communication', 'Scheduling and administration', 'Clinical documentation', 'Coverage and prior authorisation', 'Research'],
    boardDates: { workshop: '2026-11-17', resolution: '2026-12-14' }, managementReview: '2026-12-21',
    people: [
      P('p-chair', 'Dr. Margaret Ellison', 'Fernhollow Health (board)', ['chair']),
      P('p-dir1', 'Robert Achebe', 'Fernhollow Health (board, chair of the quality and safety committee)', ['director']),
      P('p-dir2', 'Lisa Brennan', 'Fernhollow Health (board)', ['director']),
      P('p-ceo', 'Dr. Ahmed Siddiqui', 'Fernhollow Health', ['ceo']),
      P('p-cro', 'Carla Jenkins', 'Fernhollow Health (chief risk and compliance officer)', ['cro']),
      P('p-gc', 'Nathan Roth', 'Fernhollow Health', ['gc']),
      P('p-cmo', 'Dr. Yvonne Castillo', 'Fernhollow Health (chief medical officer)', ['areaOwner']),
      P('p-rev', 'Thomas Greer', 'Fernhollow Health (vice president, revenue cycle)', ['areaOwner']),
      P('p-cio', 'Angela Park', 'Fernhollow Health (chief information officer)', ['technologyOwner']),
      P('p-aig1', 'Dr. Ben Okafor', 'Fernhollow Health (clinical AI governance)', ['aiGovernance']),
      P('p-aig2', 'Rachel Simmons', 'Fernhollow Health (AI governance)', ['aiGovernance']),
    ],
    scopeAgreed: { gcBy: 'p-gc', gcOn: '2026-11-09', chairBy: 'p-chair', chairOn: '2026-11-10' },
    briefing: { heldOn: '2026-11-04', gc: 'Nathan Roth', cio: 'Angela Park', confirmed: confirmed3('2026-11-04', '2026-11-05', '2026-11-05') },
    education: { 'p-chair': { readOn: '2026-11-11', completedOn: '2026-11-11' }, 'p-dir1': { readOn: '2026-11-12', completedOn: '2026-11-12' }, 'p-dir2': { readOn: '2026-11-16', completedOn: '' } },
    unconfirmed: 'L10', confirmedOn: '2026-11-12',
    inventory: [
      L('L1', 'Alerting nurses to inpatients at risk of sepsis', 'The EHR’s predictive sepsis model', 'A1', 'Staff', 'A2', 'G5', 'K2', true, 'p-cmo', 'EHR configuration record and the vendor’s model information', { decisions: 'Which patients are flagged for a sepsis assessment; a nurse and the treating physician decide', personalInfo: 'Vital signs, lab results, diagnoses and medications' }),
      L('L2', 'Prioritizing chest images with suspected findings on the radiologist’s worklist', 'Imaging AI (FDA-cleared, licensed)', 'A2', 'Staff', 'A2', 'G5', 'K2', true, 'p-cmo', 'Imaging AI agreement and its labeling', { decisions: 'The order in which a radiologist reads studies; the radiologist reports every study', personalInfo: 'Medical images and the patient’s identifiers' }),
      L('L3', 'Drafting clinic visit notes from the conversation, for the clinician to edit and sign', 'Ambient scribe (licensed)', 'A5', 'A provider for us', 'A1', 'G5', 'K2', false, 'p-cmo', 'Ambient scribe agreement and business associate agreement'),
      L('L4', 'Answering patients’ scheduling and billing questions in the patient portal', 'Patient portal assistant', 'A3', 'Customers directly', 'A2', 'G5', 'K2', false, 'p-rev', 'Patient portal agreement, schedule 2'),
      L('L5', 'Drafting prior authorization requests to health plans from the chart', 'The revenue cycle vendor’s authorization tool', 'A6', 'A provider for us', 'A2', 'G5', 'K2', false, 'p-rev', 'Revenue cycle services agreement and business associate agreement'),
      L('L6', 'Predicting no-shows and overbooking clinic schedules', 'Scheduling optimization tool (licensed)', 'A4', 'Staff', 'A3', 'G5', 'K2', true, 'p-rev', 'Scheduling vendor statement of work', { decisions: 'Which appointment slots are double-booked, which affects how long a patient waits', personalInfo: 'Appointment history, demographics, insurance type' }),
      L('L7', 'Drafting replies to patient portal messages for the clinician to edit and send', 'The EHR’s message drafting feature', 'A3', 'Staff', 'A1', 'G5', 'K2', false, 'p-cmo', 'EHR release notes, 2026'),
      L('L8', 'Identifying patients who may be eligible for clinical trials', 'Research cohort tool', 'A7', 'Staff', 'A1', 'G5', 'K2', false, 'p-cmo', 'Research office protocol, approved by the IRB'),
      L('L9', 'Transcribing meetings, including board and medical staff committee meetings', 'Video-call platform AI notes', 'A4', 'Staff, including board committees', 'A1', 'G6', 'K3', false, 'p-cio', 'Interview with the CIO, 3 Nov'),
      L('L10', 'Staff using consumer chatbots on their phones', 'Not known: any consumer tool', 'A4', 'Staff', 'A1', 'G6', 'K5', false, 'p-cio', 'Not known: CIO to survey by 1 Dec'),
    ],
    goals: [
      { id: 'GL1', goal: 'Use AI to give clinicians back time from documentation, without it standing in for clinical judgment', owner: 'Dr. Yvonne Castillo', measure: 'BM1: AI uses in the inventory, and how many are new since the last report', proposedBy: 'p-ceo' },
      { id: 'GL2', goal: 'No patient’s care is delayed or worsened because of AI, and no tool treats patients differently by race, sex, age or disability without that being found and reduced', owner: 'Carla Jenkins', measure: 'BM3: material AI incidents', proposedBy: 'p-dir2' },
      { id: 'GL3', goal: 'Know what AI our EHR vendor, the scribe and our other business associates use on our patients’ information', owner: 'Angela Park', measure: 'BM6: material providers whose use of AI on patients is not known', proposedBy: 'p-dir1' },
    ],
    postures: {
      A1: { posture: 'S2', condition: 'A clinician decides every treatment', proposedBy: 'p-dir1' },
      A2: { posture: 'S2', condition: 'A radiologist or pathologist reports every study', proposedBy: 'p-dir1' },
      A3: { posture: 'S2', condition: 'General information only; anything about a patient’s own care goes to a clinician', proposedBy: 'p-dir2' },
      A4: { posture: 'S3', condition: 'No patient loses an appointment because of a prediction', proposedBy: 'p-ceo' },
      A5: { posture: 'S3', condition: 'The clinician edits and signs every note', proposedBy: 'p-ceo' },
      A6: { posture: 'S2', condition: '', proposedBy: 'p-dir2' },
      A7: { posture: 'S2', condition: 'Within the protocol the IRB approved', proposedBy: 'p-chair' },
    },
    lines: [
      { id: 'RL1', use: 'AI deciding to deny or delay a patient’s care with no clinician reviewing it', scope: 'Clinical care; Diagnostics; Coverage and prior authorisation', appliesTo: 'Fernhollow and its providers', testedAgainst: 'none', proposedBy: 'p-dir1' },
      { id: 'RL2', use: 'Patient-facing advice with no clinical oversight', scope: 'Patient communication', appliesTo: 'Fernhollow and its providers', testedAgainst: 'none', proposedBy: 'p-dir2' },
      { id: 'RL3', use: 'Health information in tools not under Fernhollow’s contract', scope: 'All areas', appliesTo: 'Fernhollow, its staff and its providers', testedAgainst: 'L10', proposedBy: 'p-chair' },
      { id: 'RL4', use: 'Board or medical staff committee information (G6) entered into any tool outside Fernhollow’s own estate', scope: 'All areas', appliesTo: 'Fernhollow and its advisers', testedAgainst: 'L10', proposedBy: 'p-chair' },
    ],
    events: reserved('The EHR vendor or the scribe vendor changing the AI it uses on patients’ records', 'p-chair'),
    conditions: [
      'With conditions means: only in a tool Fernhollow has under a business associate agreement, that does not train on patients’ information, and only for the people who already have access to it.',
      'Patients’ health information (G5) goes only into a tool named in a business associate agreement.',
      'Meeting AI may not run in board, quality and safety or medical staff committee meetings.',
    ],
    harms: harms(['A patient whose care is delayed, denied or worsened because of AI', 'Any single patient harmed; 10 or more patients for any delay'], ['A wrong bill, a denied claim or a financial loss from AI', '$250,000 in a single event or $1 million in a quarter'], 'Patient safety event definitions'),
    measures: measures('patients', '30 June 2027').concat([{ id: 'BM9', measure: 'Decision support tools in use without a current record of how discrimination risk was identified and reduced', limit: '0', owner: 'CRO' }]),
    measuresConfirmedOn: '2026-11-16', reportEvents: reportEvents('a patient'),
    owners: { AC1: 'Quality and safety committee', AC2: 'Robert Achebe', AC3: 'Dr. Ahmed Siddiqui, CEO', AC4: 'Each executive for their area', AC5: 'The CEO with the chief medical officer, for up to 90 days, reported under BM2' },
    questions: [
      { ref: 'QC-01', step: 'B1', lines: ['L1', 'L2', 'L6'], question: 'Lines L1, L2 and L6 shape decisions about individual patients. Which of them are patient care decision support tools that use race, sex, age or disability as an input, and what record of reducing that risk does Fernhollow keep?', status: 'answered', response: 'Calder & Whit LLP advised on 18 November: L1 uses age; L2 and L6 do not use those characteristics as inputs. The clinical AI governance group keeps the record for L1 and reviews it each quarter.', sentOn: '2026-11-11', respondedOn: '2026-11-18', raisedBy: 'p-rec' },
      { ref: 'QC-02', step: 'B3', question: 'With the federal certification change from 28 December 2026, how does Fernhollow get the source and known limits of the EHR’s predictive models, which red line RL1 relies on?', status: 'answered', response: 'By contract: the EHR agreement amendment signed on 20 November obliges the vendor to keep supplying them.', sentOn: '2026-11-17', respondedOn: '2026-11-23', raisedBy: 'p-adv' },
      { ref: 'QC-03', step: 'B8', question: 'May the board leave these positions with the quality and safety committee between reviews?', status: 'open', response: '', sentOn: '2026-11-17', raisedBy: 'p-gc' },
    ],
    directionsOn: '2026-11-24', minuteRef: 'Board minute 2026/12-06',
  });
}

/* ---------- Ridgeline Power & Transmission: an investor-owned transmission utility, standalone mode ---------- */
function buildGrid(brief) {
  return build({
    id: 'example-us-grid', company: 'Ridgeline Power & Transmission', entityType: 'criticalInfrastructureAssetOwner', sector: 'US-CRITICAL-INFRASTRUCTURE', mode: 'standalone', pack: 'usCriticalInfrastructure', reference: 'RPT-BD-2026', brief,
    areas: ['Network operations', 'Asset maintenance', 'Customer and community service', 'Emergency response', 'Supplier management', 'Information technology', 'Operational technology', 'Commercial operations'],
    boardDates: { workshop: '2026-11-19', resolution: '2026-12-17' }, managementReview: '2026-12-23',
    people: [
      P('p-chair', 'Franklin Doyle', 'Ridgeline Power & Transmission (board)', ['chair']),
      P('p-dir1', 'Patricia Nguyen', 'Ridgeline Power & Transmission (board, chair of the operations and safety committee)', ['director']),
      P('p-dir2', 'Oscar Whitfield', 'Ridgeline Power & Transmission (board)', ['director']),
      P('p-ceo', 'Andrea Martinez', 'Ridgeline Power & Transmission', ['ceo']),
      P('p-cro', 'Kenneth Albright', 'Ridgeline Power & Transmission (chief risk officer)', ['cro']),
      P('p-gc', 'Samantha Reyes', 'Ridgeline Power & Transmission', ['gc']),
      P('p-ops', 'Wesley Grant', 'Ridgeline Power & Transmission (vice president, grid operations)', ['areaOwner']),
      P('p-cip', 'Tamara Lindqvist', 'Ridgeline Power & Transmission (CIP senior manager)', ['areaOwner']),
      P('p-cio', 'Victor Huang', 'Ridgeline Power & Transmission (chief information and security officer)', ['technologyOwner']),
      P('p-aig1', 'Courtney Mills', 'Ridgeline Power & Transmission (AI governance)', ['aiGovernance']),
      P('p-aig2', 'Jamal Wright', 'Ridgeline Power & Transmission (AI governance)', ['aiGovernance']),
    ],
    scopeAgreed: { gcBy: 'p-gc', gcOn: '2026-11-11', chairBy: 'p-chair', chairOn: '2026-11-12' },
    briefing: { heldOn: '2026-11-06', gc: 'Samantha Reyes', cio: 'Victor Huang', confirmed: confirmed3('2026-11-06', '2026-11-09', '2026-11-09') },
    education: { 'p-chair': { readOn: '2026-11-13', completedOn: '2026-11-13' }, 'p-dir1': { readOn: '2026-11-16', completedOn: '2026-11-16' }, 'p-dir2': { readOn: '2026-11-18', completedOn: '' } },
    unconfirmed: 'L10', confirmedOn: '2026-11-16',
    inventory: [
      L('L1', 'Forecasting load and suggesting switching plans to the system operator', 'The energy management system vendor’s forecasting module', 'A1', 'Staff', 'A2', 'G3', 'K2', false, 'p-ops', 'EMS support agreement, schedule 2'),
      L('L2', 'Predicting transformer and breaker failures from sensor data', 'Asset health analytics service', 'A2', 'A provider for us', 'A2', 'G2', 'K2', false, 'p-ops', 'Asset analytics agreement, 2025'),
      L('L3', 'Detecting vegetation encroachment on lines from drone and satellite images', 'The vegetation contractor’s image analysis', 'A2', 'A provider for us', 'A2', 'G2', 'K7', false, 'p-ops', 'Vegetation management contract, schedule 4'),
      L('L4', 'Detecting anomalies on the control network and opening tickets for the security operations center', 'OT network monitoring (licensed)', 'A7', 'Staff', 'A2', 'G3', 'K2', false, 'p-cip', 'CIP-007 and CIP-010 program documents'),
      L('L5', 'Remote diagnostics on substation relays by the relay vendor', 'The relay vendor’s remote support service', 'A7', 'A provider for us', 'A3', 'G3', 'K7', false, 'p-cip', 'Relay support agreement and the CIP-013 supply chain plan'),
      L('L6', 'Answering customer and community questions about outages and projects', 'Website and text-message assistant', 'A3', 'Customers directly', 'A2', 'G4', 'K2', false, 'p-ops', 'Customer communications vendor statement of work'),
      L('L7', 'Prioritizing restoration crews during a major storm', 'Outage management system’s restoration planner', 'A4', 'Staff', 'A2', 'G3', 'K2', false, 'p-ops', 'Emergency response plan, annex C'),
      L('L8', 'Drafting procurement documents and screening supplier security questionnaires', 'Enterprise assistant (licensed)', 'A5', 'Staff', 'A1', 'G3', 'K1', false, 'p-cip', 'IT license list, 5 Nov'),
      L('L9', 'Transcribing meetings, including board and operations committee meetings', 'Video-call platform AI notes', 'A6', 'Staff, including board committees', 'A1', 'G6', 'K3', false, 'p-cio', 'Interview with the CISO, 5 Nov'),
      L('L10', 'Staff using consumer chatbots on their phones', 'Not known: any consumer tool', 'A6', 'Staff', 'A1', 'G6', 'K5', false, 'p-cio', 'Not known: CISO to survey by 4 Dec'),
    ],
    goals: [
      { id: 'GL1', goal: 'Use AI to find failing equipment and encroaching vegetation before they cause outages, without it acting on the grid by itself', owner: 'Wesley Grant', measure: 'BM1: AI uses in the inventory, and how many are new since the last report', proposedBy: 'p-ceo' },
      { id: 'GL2', goal: 'No AI tool, ours or a vendor’s, gives anyone a path to the control systems that the supply chain program has not approved', owner: 'Tamara Lindqvist', measure: 'BM3: material AI incidents', proposedBy: 'p-dir1' },
      { id: 'GL3', goal: 'Know what AI our grid and security vendors use, and which of it reaches operational systems', owner: 'Victor Huang', measure: 'BM6: material providers whose use of AI on operational systems is not known', proposedBy: 'p-dir2' },
    ],
    postures: {
      A1: { posture: 'S2', condition: 'The system operator decides every switching action', proposedBy: 'p-dir1' },
      A2: { posture: 'S3', condition: 'Recommendations only; a planner approves every work order', proposedBy: 'p-ceo' },
      A3: { posture: 'S3', condition: 'Outage and project information only; anything about a customer’s account goes to a person', proposedBy: 'p-ceo' },
      A4: { posture: 'S2', condition: 'The incident commander decides crew assignments', proposedBy: 'p-dir1' },
      A5: { posture: 'S3', condition: '', proposedBy: 'p-ceo' },
      A6: { posture: 'S2', condition: 'No AI holds credentials to production systems unattended', proposedBy: 'p-dir2' },
      A7: { posture: 'S1', condition: '', proposedBy: 'p-chair' },
      A8: { posture: 'S2', condition: '', proposedBy: 'p-dir2' },
    },
    lines: [
      { id: 'RL1', use: 'AI changing a safety-critical operational setting with no authorised person approving it', scope: 'Network operations; Operational technology', appliesTo: 'The utility and its vendors', testedAgainst: 'none', proposedBy: 'p-dir1' },
      { id: 'RL2', use: 'AI with a path from the internet to control systems', scope: 'Operational technology', appliesTo: 'The utility and its vendors', testedAgainst: 'L5', proposedBy: 'p-dir1' },
      { id: 'RL3', use: 'Decisions about individuals’ service with no review', scope: 'Customer and community service', appliesTo: 'The utility and its providers', testedAgainst: 'none', proposedBy: 'p-dir2' },
      { id: 'RL4', use: 'Board, operations committee or critical energy infrastructure information (G6) entered into any tool outside the utility’s own estate', scope: 'All areas', appliesTo: 'The utility and its advisers', testedAgainst: 'L10', proposedBy: 'p-chair' },
    ],
    events: reserved('A grid or security vendor changing the AI it uses on our operational systems, or how it reaches them', 'p-chair'),
    conditions: [
      'With conditions means: only in a tool the utility or a vendor has under agreement, that does not train on the utility’s information, and only for the people who already have access to it.',
      'Information about BES Cyber Systems and critical energy infrastructure (G5) goes only into a tool named in the CIP-013 supply chain plan.',
      'Meeting AI may not run in board or operations and safety committee meetings.',
    ],
    harms: harms(['A customer or community left without power, or without accurate outage information, because of AI', 'Any outage AI caused; 1,000 or more customers given wrong restoration times'], ['Equipment damage or a financial loss from AI', '$1 million in a single event or $3 million in a quarter'], 'Reliability and customer service incident definitions'),
    measures: measures('operational systems', '30 June 2027'),
    measuresConfirmedOn: '2026-11-18', reportEvents: reportEvents('a customer'),
    owners: { AC1: 'Operations and safety committee', AC2: 'Patricia Nguyen', AC3: 'Andrea Martinez, CEO', AC4: 'Each executive for their area', AC5: 'The CEO with the CIP senior manager, for up to 90 days, reported under BM2' },
    questions: [
      { ref: 'QC-01', step: 'B1', lines: ['L5'], question: 'Line L5 gives the relay vendor remote access to substation relays. Does the CIP-013 supply chain plan cover the vendor’s use of AI in that service, and what does the procurement process ask of it?', status: 'answered', response: 'Calder & Whit LLP advised on 20 November: the plan covers remote access but not AI. The CIP senior manager has drafted an addendum on vendor AI for the next 15-month review.', sentOn: '2026-11-13', respondedOn: '2026-11-20', raisedBy: 'p-rec' },
      { ref: 'QC-02', step: 'B4', question: 'Once the federal incident reporting rule is in force, which AI-related cyber incidents would Ridgeline report, and does the incident response plan route them in time?', status: 'answered', response: 'Any substantial cyber incident, whatever its cause; the plan routes them to the CISO within one hour. The plan is reviewed again when the final rule is published.', sentOn: '2026-11-19', respondedOn: '2026-11-25', raisedBy: 'p-adv' },
      { ref: 'QC-03', step: 'B8', question: 'May the board leave these positions with the operations and safety committee between reviews?', status: 'open', response: '', sentOn: '2026-11-19', raisedBy: 'p-gc' },
    ],
    directionsOn: '2026-11-26', minuteRef: 'Board minute 2026/12-05',
  });
}

// The matter briefs, as loaded at B0: built in the AI Obligations Atlas for each organisation's entity type, the United
// States and its use cases, from the published records (tools/build-us-example-briefs.mjs writes them).
const BRIEFS = window.BDUSBriefs || {};
const note = (who, what) => `Worked example: a fictional ${what}, ${who}, its board and advisers, for practice only. Nothing is saved.`;
window.BDExamples = (window.BDExamples || []).concat([
  { id: 'us-banking', jurisdiction: 'US', name: 'Bank (United States)', note: note('Harlow Ridge Bank', 'US bank'), offer: 'A fictional New York bank’s board gives its directions before the AI risk appetite engagement, and approves the statement prepared within them.', build: () => buildBank(BRIEFS.bank) },
  { id: 'us-insurance', jurisdiction: 'US', name: 'Insurer (United States)', note: note('Ashgrove Mutual Insurance Company', 'US property and casualty insurer'), offer: 'A fictional mutual insurer’s board sets how far AI may go in underwriting, pricing and claims, across the states where it writes.', build: () => buildInsurer(BRIEFS.insurer) },
  { id: 'us-securities', jurisdiction: 'US', name: 'Broker-dealer (United States)', note: note('Quillfield Securities', 'US broker-dealer and investment adviser'), offer: 'A fictional broker-dealer’s board sets the scope for an onboarding agent and keeps every client communication under supervision.', build: () => buildSecurities(BRIEFS.securities) },
  { id: 'us-health', jurisdiction: 'US', name: 'Health system (United States)', note: note('Fernhollow Health', 'US health system'), offer: 'A fictional nonprofit health system’s board keeps clinical judgment with clinicians and asks for a record on every decision support tool.', build: () => buildHealth(BRIEFS.health) },
  { id: 'us-critical-infrastructure', jurisdiction: 'US', name: 'Transmission utility (United States)', note: note('Ridgeline Power & Transmission', 'US transmission utility'), offer: 'A fictional utility’s board keeps AI off the control systems and asks what its grid vendors’ AI can reach.', build: () => buildGrid(BRIEFS.grid) },
]);
})();
