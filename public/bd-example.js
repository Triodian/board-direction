/* AI Board Direction · the worked example.
   A fictional unregulated company in standalone mode, with every step B0 to B9 recorded and the board's resolution.
   It runs in the browser only and is never saved. The company, its people and its advisers are invented; any likeness
   to a real organisation is coincidence. Positions are illustrations of the method, not recommendations. */
(function () {
'use strict';
function buildUnregulated() {
  const P = (id, name, organisation, roles) => ({ id, name, organisation, roles, active: true });
  const areas = [
    ['A1', 'Customer service and communications'], ['A2', 'Sales and marketing'], ['A3', 'People and hiring'], ['A4', 'Finance and payments'],
    ['A5', 'Operations and production'], ['A6', 'Product, research and engineering'], ['A7', 'Procurement and suppliers'], ['A8', 'Legal, contracts and compliance'],
    ['A9', 'IT and security'], ['A10', 'Board and executive work'],
  ].map(([id, name]) => ({ id, name }));
  const L = (id, use, tool, area, who, authority, info, kind, adm, owner, source) => ({ id, use, tool, area, who, authority, info, kind, adm, owner, source });
  const S = {
    schema: 'triodian.bd.v1',
    engagement: {
      id: 'example', example: true, company: 'Harrow Valley Foods Pty Ltd', entityType: 'privateCompany', jurisdiction: 'AU', mode: 'standalone',
      reference: 'HVF-BD-2026', privilegeMarking: 'Privileged and confidential · prepared at the request of counsel',
      practitioner: { firm: 'Kestrel Board Advisory', line: 'Prepared by Kestrel Board Advisory using the Triodian method', logo: TriodianBrand.EXAMPLE_LOGO },
      boardDates: { workshop: '2026-11-18', resolution: '2026-12-02' }, gcActsAsCounsel: false, secondApproverId: '', sectorPack: 'general',
      matterBrief: {"format": "triodian.matterBrief/1", "loadedOn": "2026-11-09", "loadedBy": "Lee Chan", "generatedAt": "2026-11-13T00:46:29.458Z", "scope": "Private company · Australia · use cases UC1, UC3, UC6", "scopeCodes": {"jurisdictions": ["AU"], "entityTypes": ["privateCompany"], "useCases": ["UC1", "UC3", "UC6"]}, "dataset": {"generatedAt": "2026-11-08T03:01:42.004Z", "preview": false}, "tiers": [{"tier": "Binding", "refs": []}, {"tier": "Expected", "refs": [["OBL-AU-OAIC-APP1-GUIDE", "OAIC guidance on ADM privacy policy transparency", "OAIC APP Guidelines Chapter 1 (APP 1) update and APP 1.7-1.9 Transparency Obligation Fact Sheet and Flowchart", "APP Guidelines Chapter 1; Fact Sheet; Flowchart", "inForce", "https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-1-app-1-open-and-transparent-management-of-personal-information"], ["OBL-AU-DISR-AI-ADOPTION", "Six essential practices for responsible AI adoption", "Guidance for AI Adoption (Foundations and Implementation Practices)", "Essential practices 1-6", "inForce", "https://www.industry.gov.au/publications/guidance-ai-adoption"], ["OBL-INT-ISO42001", "AI management system standard", "ISO/IEC 42001:2023 Information technology - Artificial intelligence - Management system", "Whole standard (clauses 4-10, Annex A controls)", "inForce", "https://www.iso.org/standard/42001"], ["OBL-INT-NIST-AIRMF", "NIST AI RMF and Generative AI Profile", "NIST AI Risk Management Framework 1.0 (NIST AI 100-1) and Generative AI Profile (NIST AI 600-1)", "Core functions: Govern, Map, Measure, Manage", "inForce", "https://www.nist.gov/itl/ai-risk-management-framework"]]}, {"tier": "Anticipated", "refs": [["OBL-AU-PRIVACY-APP1-7", "Privacy policy disclosure of automated decisions (APP 1.7-1.9)", "Privacy Act 1988 (Cth), Schedule 1 (APPs), as amended by the Privacy and Other Legislation Amendment Act 2024", "APP 1.7, 1.8, 1.9 (inserted by POLA Act 2024 Sch 1 Part 15, item 88; application item 89)", "pending", "https://legislation.gov.au/C2024A00128/asmade/2024-12-10/text/original/epub/OEBPS/document_1/document_1.html"]]}], "questions": [{"about": "UC1", "question": "Measured against the client’s own thresholds, which consequence level (C1 to C5) should counsel set for UC1 (Staff copilot drafts and summarises)?"}, {"about": "UC3", "question": "Measured against the client’s own thresholds, which consequence level (C1 to C5) should counsel set for UC3 (Automated triage or decline)?"}, {"about": "UC6", "question": "Measured against the client’s own thresholds, which consequence level (C1 to C5) should counsel set for UC6 (Agent with write access to systems of record)?"}, {"about": "OBL-AU-DISR-AI-ADOPTION", "question": "What weight should the client give to Guidance for AI Adoption (Foundations and Implementation Practices) (National Artificial Intelligence Centre (Department of Industry, Science and Resources)) in its approach to the selected use cases?"}, {"about": "OBL-AU-OAIC-APP1-GUIDE", "question": "What weight should the client give to OAIC APP Guidelines Chapter 1 (APP 1) update and APP 1.7-1.9 Transparency Obligation Fact Sheet and Flowchart (OAIC) in its approach to the selected use cases?"}, {"about": "OBL-AU-PRIVACY-APP1-7", "question": "How should the client prepare for Privacy Act 1988 (Cth), Schedule 1 (APPs), as amended by the Privacy and Other Legislation Amendment Act 2024, which is made but not yet in force (key date 2026-12-10)?"}, {"about": "OBL-INT-ISO42001", "question": "What weight should the client give to ISO/IEC 42001:2023 Information technology - Artificial intelligence - Management system (ISO/IEC JTC 1/SC 42) in its approach to the selected use cases?"}, {"about": "OBL-INT-NIST-AIRMF", "question": "What weight should the client give to NIST AI Risk Management Framework 1.0 (NIST AI 100-1) and Generative AI Profile (NIST AI 600-1) (NIST (US Department of Commerce)) in its approach to the selected use cases?"}], "coverage": [], "notices": ["Records state what sources say and how they are classified. They are not legal advice and do not say what the law requires of any particular client; counsel decides what applies.", "Tiers describe sources: Binding (law or prudential standard in force), Expected (regulator expectation, guidance or recognised standard), Anticipated (made but not yet in force, or under consultation).", "This brief was built in the browser. The matter label, scope and consequence levels were not sent to Triodian."]},
    },
    areas,
    people: [
      P('p-chair', 'Margaret Lowe', 'Harrow Valley Foods (board)', ['chair']),
      P('p-dir1', 'Sam Okafor', 'Harrow Valley Foods (board)', ['director']),
      P('p-dir2', 'Priya Raman', 'Harrow Valley Foods (board)', ['director']),
      P('p-ceo', 'Tom Adeyemi', 'Harrow Valley Foods', ['ceo']),
      P('p-gc', 'Jess Carter', 'Northgate Legal (fractional GC)', ['gc']),
      P('p-adv', 'Alex Morgan', 'Kestrel Board Advisory', ['advisor']),
      P('p-rec', 'Lee Chan', 'Triodian', ['methodOwner', 'recorder']),
      P('p-ops', 'Dana Whitfield', 'Harrow Valley Foods', ['areaOwner']),
      P('p-cio', 'Nikhil Rao', 'Harrow Valley Foods (head of technology)', ['technologyOwner']),
      P('p-aig1', 'Elena Petrova', 'Harrow Valley Foods (AI governance)', ['aiGovernance']),
      P('p-aig2', 'Marcus Bell', 'Harrow Valley Foods (AI governance)', ['aiGovernance']),
    ],
    scopeAgreed: { gcBy: 'p-gc', gcOn: '2026-11-10', chairBy: 'p-chair', chairOn: '2026-11-11' },
    // The management briefing (plan task 7.3): held before anything went to directors, and read by management.
    managementBriefing: { heldOn: '2026-11-06', attended: 'Alex Morgan, Jess Carter and Lee Chan with Nikhil Rao and the AI governance team', recordedBy: 'p-adv', notNeeded: '', confirmed: { 'p-cio': '2026-11-06', 'p-aig1': '2026-11-07', 'p-aig2': '2026-11-09' } },
    // The director briefing: read and completion dates only. Answers are kept apart and are not in the engagement.
    education: { 'p-chair': { readOn: '2026-11-12', completedOn: '2026-11-12' }, 'p-dir1': { readOn: '2026-11-13', completedOn: '2026-11-13' }, 'p-dir2': { readOn: '2026-11-16', completedOn: '' } },
    inventory: [
      L('L1', 'Drafting emails, summaries and reports', 'Enterprise chat assistant (licensed)', 'A10', 'Staff', 'A1', 'G3', 'K2', false, 'p-ceo', 'IT licence list, 9 Nov'),
      L('L2', 'Meeting transcription and action notes', 'Video-call platform AI notes', 'A10', 'Staff, including board meetings', 'A1', 'G6', 'K3', false, 'p-ceo', 'Interview with the CEO, 10 Nov'),
      { ...L('L3', 'Shortlisting job applicants', 'Recruitment platform’s CV screening', 'A3', 'A provider for us', 'A2', 'G4', 'K2', true, 'p-ceo', 'Recruitment contract, schedule 2'), decisions: 'Which applicants go forward to interview', personalInfo: 'CVs, work history, qualifications' },
      { ...L('L4', 'Answering customer order questions', 'Website chatbot', 'A1', 'Customers directly', 'A3', 'G4', 'K2', true, 'p-ceo', 'Website vendor statement of work'), decisions: 'Whether a refund or replacement is offered on a delivery complaint', personalInfo: 'Name, contact details, order history' },
      L('L5', 'Matching invoices to orders and queuing payment', 'Accounts payable automation', 'A4', 'Staff', 'A4', 'G3', 'K2', false, 'p-ceo', 'Finance system release notes'),
      L('L6', 'Spotting defects on the packing line', 'Inspection camera AI, line 2', 'A5', 'Staff', 'A3', 'G2', 'K2', false, 'p-ops', 'Plant engineering register'),
      L('L7', 'Demand forecasting for raw ingredients', 'Supplier’s forecasting service', 'A7', 'A provider for us', 'A2', 'G3', 'K7', false, 'p-ops', 'Supply agreement, clause 14'),
      L('L8', 'Staff using consumer chatbots on their phones', 'Not known: any consumer tool', 'A10', 'Staff', 'A1', 'G6', 'K5', false, 'p-ceo', 'Not known: CEO to survey by 30 Nov'),
      L('L9', 'Drafting product descriptions and campaign copy', 'Enterprise chat assistant (licensed)', 'A2', 'Staff', 'A1', 'G2', 'K2', false, 'p-ceo', 'IT licence list, 9 Nov'),
      L('L10', 'Suggesting recipe changes from ingredient costs and supply', 'Product development planning tool', 'A6', 'Staff', 'A2', 'G3', 'K2', false, 'p-ops', 'Interview with the head of operations, 10 Nov'),
      L('L11', 'Reviewing supplier contracts for unusual terms', 'The law firm’s contract review tool', 'A8', 'An adviser for us', 'A1', 'G3', 'K7', false, 'p-ceo', 'Northgate Legal engagement letter, schedule 1'),
      L('L12', 'Suggesting and reviewing code for the ordering system', 'Code assistant (licensed)', 'A9', 'Staff', 'A1', 'G2', 'K2', false, 'p-cio', 'IT licence list, 9 Nov'),
    ].map((l, i) => ({ ...l, suppliedBy: i % 2 ? 'p-aig2' : 'p-aig1', ...(l.id === 'L8' ? {} : { confirmedBy: 'p-cio', confirmedOn: '2026-11-11' }) })),  // supplied by the AI governance team; L8 is not yet confirmed
    positions: {
      B2: {
        goals: [
          { id: 'GL1', goal: 'Use AI to take routine work off staff in the office and on the packing lines, safely', owner: 'Tom Adeyemi, CEO', measure: 'BM1: AI uses in the inventory, and how many are new since the last report', proposedBy: 'p-ceo' },
          { id: 'GL2', goal: 'Keep customers’ and applicants’ trust in how we use AI on them', owner: 'Priya Raman', measure: 'BM3: material AI incidents', proposedBy: 'p-dir2' },
          { id: 'GL3', goal: 'Keep the lines running if an AI provider fails or changes its service', owner: 'Dana Whitfield', measure: 'Hours of packing-line stoppage caused by an AI provider, each quarter', proposedBy: 'p-dir1' },
        ],
        A1: { posture: 'S2', condition: 'The chatbot hands any complaint or refund to a person', proposedBy: 'p-dir2' },
        A2: { posture: 'S3', condition: '', proposedBy: 'p-ceo' },
        A3: { posture: 'S2', condition: 'No applicant is rejected without a person reviewing', proposedBy: 'p-dir1' },
        A4: { posture: 'S2', condition: 'Payments over $10,000 need a second person', proposedBy: 'p-dir1' },
        A5: { posture: 'S3', condition: 'Within food-safety limits the line already works to', proposedBy: 'p-ceo' },
        A6: { posture: 'S3', condition: '', proposedBy: 'p-ceo' },
        A7: { posture: 'S2', condition: '', proposedBy: 'p-dir2' },
        A8: { posture: 'S1', condition: '', proposedBy: 'p-chair' },
        A9: { posture: 'S2', condition: '', proposedBy: 'p-dir1' },
        A10: { posture: 'S2', condition: 'Board papers only in the licensed assistant', proposedBy: 'p-chair' },
      },
      B3: { lines: [
        { id: 'RL1', use: 'AI making a final decision to hire, dismiss or discipline a person, with no person reviewing it', scope: 'All areas', appliesTo: 'The company and its providers', testedAgainst: 'none', proposedBy: 'p-dir1' },
        { id: 'RL2', use: 'Board papers, pricing or acquisition information (G6) entered into any tool outside the company’s own estate', scope: 'All areas', appliesTo: 'The company and its advisers', testedAgainst: 'L8', proposedBy: 'p-chair' },
        { id: 'RL3', use: 'AI holding credentials to release payments unattended', scope: 'Finance and payments', appliesTo: 'The company and its providers', testedAgainst: 'none', proposedBy: 'p-dir1' },
      ] },
      B4: { events: [
        { id: 'RV1', event: 'A new AI use at A3 (Decides) or above', timing: 'Before it starts', by: 'CEO', proposedBy: 'p-chair' },
        { id: 'RV2', event: 'A new AI use in an area marked Avoid', timing: 'Before it starts', by: 'CEO', proposedBy: 'p-chair' },
        { id: 'RV3', event: 'An exception to a red line', timing: 'Before it starts', by: 'CEO', proposedBy: 'p-dir1' },
        { id: 'RV4', event: 'A new provider whose AI sees G5 or G6 information', timing: 'Before it starts', by: 'CEO', proposedBy: 'p-dir2' },
        { id: 'RV5', event: 'A material AI incident', timing: 'Told within 24 hours', by: 'CEO', proposedBy: 'p-dir2' },
        { id: 'RV6', event: 'A change to the statement or the measures', timing: 'Before it takes effect', by: 'Chair', proposedBy: 'p-chair' },
      ] },
      B5: {
        cells: {
          'G1:K1': 'P', 'G1:K2': 'P', 'G1:K3': 'P', 'G1:K4': 'P', 'G1:K5': 'P', 'G1:K7': 'P',
          'G2:K1': 'P', 'G2:K2': 'P', 'G2:K3': 'P', 'G2:K4': 'C', 'G2:K5': 'C', 'G2:K7': 'P',
          'G3:K1': 'P', 'G3:K2': 'C', 'G3:K3': 'C', 'G3:K4': 'N', 'G3:K5': 'N', 'G3:K7': 'C',
          'G4:K1': 'C', 'G4:K2': 'C', 'G4:K3': 'C', 'G4:K4': 'N', 'G4:K5': 'N', 'G4:K7': 'C',
          'G5:K1': 'C', 'G5:K2': 'N', 'G5:K3': 'N', 'G5:K4': 'N', 'G5:K5': 'N', 'G5:K7': 'C',
          'G6:K1': 'C', 'G6:K2': 'N', 'G6:K3': 'N', 'G6:K4': 'N', 'G6:K5': 'N', 'G6:K7': 'N',
        },
        conditions: [
          'With conditions means: only in a tool on the company’s enterprise licence that does not train on our content, and only for the people who already have access to the information.',
          'Meeting AI may not run in board meetings or on calls about pricing or acquisitions.',
        ],
        proposedBy: 'p-chair',
      },
      B6: { harms: {
        H1: { statement: 'A customer given wrong allergen or ingredient information', threshold: 'Any single instance', source: 'Food safety plan', proposedBy: 'p-dir2' },
        H2: { statement: 'An applicant screened out unfairly', threshold: 'Any pattern across a hiring round', source: 'New', proposedBy: 'p-dir1' },
        H3: { statement: 'A wrong payment released', threshold: '$10,000 per event or $50,000 a year', source: 'Delegations of authority', proposedBy: 'p-dir1' },
        H4: { statement: 'A packing line stopped', threshold: 'More than 4 hours', source: 'Operations incident thresholds', proposedBy: 'p-ceo' },
        H5: { statement: 'A breach of privacy law or a customer contract', threshold: 'Any', source: 'New', proposedBy: 'p-chair' },
        H6: { statement: 'A public failure attributed to our use of AI', threshold: 'Any media or regulator attention', source: 'New', proposedBy: 'p-chair' },
      } },
      B7: {
        measures: [
          { id: 'BM1', measure: 'AI uses in the inventory, and how many are new since the last report', limit: 'n/a', owner: 'CEO', draftedBy: 'p-aig1', confirmedBy: 'p-cio', confirmedOn: '2026-11-20' },
          { id: 'BM2', measure: 'Uses that cross a red line or exceed their area’s posture without board approval', limit: '0', owner: 'CEO', draftedBy: 'p-aig1', confirmedBy: 'p-cio', confirmedOn: '2026-11-20' },
          { id: 'BM3', measure: 'Material AI incidents', limit: '0', owner: 'CEO', draftedBy: 'p-aig1', confirmedBy: 'p-cio', confirmedOn: '2026-11-20' },
          { id: 'BM4', measure: 'Known uses of information marked N in B5', limit: '0', owner: 'CEO', draftedBy: 'p-aig1', confirmedBy: 'p-cio', confirmedOn: '2026-11-20' },
          { id: 'BM5', measure: 'Actions on the 90-day list overdue', limit: '2', owner: 'CEO', draftedBy: 'p-aig1', confirmedBy: 'p-cio', confirmedOn: '2026-11-20' },
          { id: 'BM6', measure: 'Concerns about the use of AI raised through the reporting route, and how many remain open', limit: '0 open beyond 30 days', owner: 'CEO', draftedBy: 'p-aig1', confirmedBy: 'p-cio', confirmedOn: '2026-11-20' },
        ],
        events: [
          { id: 'EV1', event: 'A material AI incident', to: 'Chair', within: '24 hours' },
          { id: 'EV2', event: 'A red line crossed', to: 'Chair', within: '24 hours' },
          { id: 'EV3', event: 'A regulator, customer or counterparty raises AI use with the company', to: 'Chair and GC', within: '2 working days' },
          { id: 'EV4', event: 'A provider changes the AI it uses for an area marked Avoid or Cautious', to: 'CEO', within: '10 working days' },
        ],
        proposedBy: 'p-chair',
      },
      B8: {
        owners: { AC1: 'Audit and risk committee', AC2: 'Priya Raman', AC3: 'Tom Adeyemi, CEO', AC4: 'Each executive for their area', AC5: 'The CEO, for up to 90 days, reported under BM2' },
        proposedBy: 'p-chair',
      },
    },
    questions: [
      { ref: 'QC-01', step: 'B1', lines: ['L3', 'L4'], question: 'Lines L3 and L4 shape decisions about individuals. Does the privacy policy need to describe them before 10 December 2026?', status: 'answered', response: 'Yes for L3 and L4. Northgate Legal will provide the policy wording by 25 November.', sentOn: '2026-11-12', respondedOn: '2026-11-14', raisedBy: 'p-rec' },
      { ref: 'QC-02', step: 'B3', question: 'Can the company require the recruitment provider to observe red line RL1, and through which contract?', status: 'answered', response: 'Through a variation to schedule 2 at the renewal on 1 February 2027.', sentOn: '2026-11-18', respondedOn: '2026-11-20', raisedBy: 'p-adv' },
      { ref: 'QC-03', step: 'B5', question: 'Do the adviser engagement letters allow us to require the G6 rule of advisers?', status: 'open', response: '', sentOn: '2026-11-18', raisedBy: 'p-gc' },
    ],
    resolution: {
      by: 'p-chair', on: '2026-12-02', minuteRef: 'Board minute 2026/12-04', interval: 'Annual, with the board’s risk review',
      text: 'The board resolves the AI risk appetite statement as recorded in steps B2 to B8, and directs the CEO to complete the 90-day action list.',
    },
    versions: [], previous: null, history: [],  // versions are added below, from the record itself
  };
  // Two sign-offs, so two versions: the scope agreed (before the workshop, no positions yet) and the resolution.
  const snap = (positions, res) => ({ areas: S.areas.map(a => a.name), positions: JSON.parse(JSON.stringify(positions)), inventoryLines: S.inventory.length, inventory: S.inventory.map(l => l.id), resolution: res });
  S.versions = [
    { id: 'V1', label: 'Scope agreed (B0)', at: '2026-11-11T09:12:00Z', by: 'Margaret Lowe', snapshot: snap({}, null) },
    { id: 'V2', label: 'Resolved by the board (B9)', at: '2026-12-02T15:40:00Z', by: 'Margaret Lowe', snapshot: snap(S.positions, { on: '2026-12-02', minuteRef: 'Board minute 2026/12-04' }) },
  ];
  return S;
}
/* The worked examples this app has, by sector. The sector ids are the same in every Triodian app and in Triodian
   Start, which opens an app on one with ?example=<id>. Each file that defines an example adds itself to the list. */
window.BDExamples = [{ id: 'unregulated', name: 'Company outside prudential regulation', note: 'Worked example: a fictional company, Harrow Valley Foods, its board and advisers, for practice only. Nothing is saved.', offer: 'A fictional manufacturer’s board takes all ten steps, from its AI inventory to a resolved statement.', build: buildUnregulated }].concat(window.BDExamples || []);
window.BDExampleOf = id => window.BDExamples.find(x => x.id === id) || window.BDExamples[0];
window.BDExample = id => window.BDExampleOf(id).build();
})();
