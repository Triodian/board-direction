/* AI Board Direction · the banking worked example.
   A fictional bank (an authorised deposit-taking institution) in connected mode: the board gives its directions BD1 to
   BD7 before the AI risk appetite engagement, and approves the statement prepared within them. The same bank,
   Wattlebrook Bank, is the worked example in AI Risk Appetite and AI Use Assessment, so the three read as one piece of
   work. It runs in the browser only and is never saved. The bank, its people, its providers and its advisers are
   invented; any likeness to a real organisation is coincidence. Positions are illustrations of the method, not
   recommendations. */
(function () {
'use strict';
function buildBank() {
  const P = (id, name, organisation, roles) => ({ id, name, organisation, roles, active: true });
  const areas = ['Retail lending and credit decisions', 'Deposits and payments', 'Business and institutional banking', 'Financial crime (AML/CTF, fraud and scams)', 'Collections and financial hardship', 'Customer service and complaints', 'Treasury, markets and finance', 'Risk, legal and compliance', 'Technology and operations'].map((name, i) => ({ id: 'A' + (i + 1), name }));
  const L = (id, use, tool, area, who, authority, info, kind, adm, owner, source, more) => Object.assign({ id, use, tool, area, who, authority, info, kind, adm, owner, source }, more || {});
  const S = {
    schema: 'triodian.bd.v1',
    engagement: {
      id: 'example-bank', example: true, company: 'Wattlebrook Bank', entityType: 'authorisedDepositTakingInstitution', jurisdiction: 'AU', sector: 'AU-BANKING', mode: 'connected',
      reference: 'WB-BD-2026', privilegeMarking: 'Privileged and confidential · prepared at the request of counsel',
      practitioner: { firm: 'Kestrel Board Advisory', line: 'Prepared by Kestrel Board Advisory using the Triodian method', logo: TriodianBrand.EXAMPLE_LOGO },
      boardDates: { workshop: '2026-10-21', resolution: '2026-11-25' }, gcActsAsCounsel: false, secondApproverId: '', sectorPack: 'adi', managementReview: '2026-12-09',
      matterBrief: {"format": "triodian.matterBrief/1", "loadedOn": "2026-10-12", "loadedBy": "Lee Chan", "generatedAt": "2026-11-13T00:02:49.863Z", "scope": "Authorised deposit-taking institution · Australia · use cases UC3, UC7", "scopeCodes": {"jurisdictions": ["AU"], "entityTypes": ["authorisedDepositTakingInstitution"], "useCases": ["UC3", "UC7"]}, "dataset": {"generatedAt": "2026-11-08T03:01:42.004Z", "preview": false}, "tiers": [{"tier": "Binding", "refs": [["OBL-AU-CPS230-33", "Operational risk incident notification within 72 hours", "Prudential Standard CPS 230 Operational Risk Management", "para 33", "inForce", "https://www.apra.gov.au/standards/cps-230"], ["OBL-AU-CPS230-35", "Critical operations, tolerance levels, BCP and 24-hour disruption notice", "Prudential Standard CPS 230 Operational Risk Management", "paras 35-38, 40, 42", "inForce", "https://www.apra.gov.au/standards/cps-230"], ["OBL-AU-CPS230-47", "Service provider management policy and material service providers", "Prudential Standard CPS 230 Operational Risk Management", "paras 47, 49, 50", "inForce", "https://www.apra.gov.au/standards/cps-230"], ["OBL-AU-CPS230-54", "Formal agreements for material arrangements and APRA notification", "Prudential Standard CPS 230 Operational Risk Management", "paras 54, 59(a), 59(b)", "inForce", "https://www.apra.gov.au/standards/cps-230"], ["OBL-AU-CPS234-16", "Information assets managed by third parties: classification and controls", "Prudential Standard CPS 234 Information Security", "paras 16, 20, 21, 22", "inForce", "https://apra.gov.au/sites/default/files/cps_234_july_2019_for_public_release.pdf"], ["OBL-AU-CPS234-27", "Control testing, internal audit and APRA notification", "Prudential Standard CPS 234 Information Security", "paras 27, 32, 35, 36", "inForce", "https://apra.gov.au/sites/default/files/cps_234_july_2019_for_public_release.pdf"], ["OBL-AU-FAR-20", "Entity accountability obligations, accountability statements and maps", "Financial Accountability Regime Act 2023 (Cth)", "s 20 (accountability obligations of an accountable entity); ss 33-34 (accountability statements and map)", "inForce", "https://www.legislation.gov.au/C2023A00067/latest"], ["OBL-AU-FAR-21", "Accountability obligations of accountable persons", "Financial Accountability Regime Act 2023 (Cth)", "s 10 (meaning of accountable person); s 21 (accountability obligations of an accountable person)", "inForce", "https://www.legislation.gov.au/C2023A00067/latest"], ["OBL-AU-CPS220-9", "Board ultimately responsible for risk management framework and risk appetite", "Prudential Standard CPS 220 Risk Management", "para 9, incl. 9(a)", "inForce", "https://www.apra.gov.au/standard/cps-220"], ["OBL-AU-CPS220-23", "Risk management framework content, material risks and risk appetite statement", "Prudential Standard CPS 220 Risk Management", "paras 23, 26, 28", "inForce", "https://www.apra.gov.au/standard/cps-220"], ["OBL-AU-CPS230-20", "Board accountable for oversight of operational risk", "Prudential Standard CPS 230 Operational Risk Management", "para 20", "inForce", "https://www.apra.gov.au/standards/cps-230"], ["OBL-AU-CPS234-13", "Board responsibility and information security capability", "Prudential Standard CPS 234 Information Security", "paras 13, 15, 18", "inForce", "https://apra.gov.au/sites/default/files/cps_234_july_2019_for_public_release.pdf"]]}, {"tier": "Expected", "refs": [["OBL-AU-APRA-AI-04", "Human involvement for high-risk AI decisions", "APRA Letter to Industry on Artificial Intelligence (AI)", "Letter, governance expectations, bullet on human involvement", "inForce", "https://www.apra.gov.au/news-and-publications/apra-letter-industry-artificial-intelligence-ai"], ["OBL-AU-APRA-AI-05", "Security testing of AI-generated code", "APRA Letter to Industry on Artificial Intelligence (AI)", "Letter, information security expectations ('APRA expects entities to actively manage information security vulnerabilities and threats. This would include:')", "inForce", "https://www.apra.gov.au/news-and-publications/apra-letter-industry-artificial-intelligence-ai"], ["OBL-AU-APRA-AI-07", "Fallback processes where AI supports critical operations", "APRA Letter to Industry on Artificial Intelligence (AI)", "Letter, information security expectations, first bullet", "inForce", "https://www.apra.gov.au/news-and-publications/apra-letter-industry-artificial-intelligence-ai"], ["OBL-AU-APRA-AI-08", "AI supplier risk: supply-chain mapping, contracts, concentration and exit", "APRA Letter to Industry on Artificial Intelligence (AI)", "Letter, supplier expectations ('APRA expects entities to manage supplier risks, this would include, at a minimum:')", "inForce", "https://www.apra.gov.au/news-and-publications/apra-letter-industry-artificial-intelligence-ai"], ["OBL-AU-OAIC-APP1-GUIDE", "OAIC guidance on ADM privacy policy transparency", "OAIC APP Guidelines Chapter 1 (APP 1) update and APP 1.7-1.9 Transparency Obligation Fact Sheet and Flowchart", "APP Guidelines Chapter 1; Fact Sheet; Flowchart", "inForce", "https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-1-app-1-open-and-transparent-management-of-personal-information"], ["OBL-AU-APRA-AI-01", "Board AI literacy (APRA minimum expectation)", "APRA Letter to Industry on Artificial Intelligence (AI)", "Letter, Boards expectations ('APRA expects Boards, at a minimum, to:'), first bullet", "inForce", "https://www.apra.gov.au/news-and-publications/apra-letter-industry-artificial-intelligence-ai"], ["OBL-AU-APRA-AI-02", "Board-overseen AI strategy within risk appetite, with defined triggers", "APRA Letter to Industry on Artificial Intelligence (AI)", "Letter, Boards expectations, second bullet", "inForce", "https://www.apra.gov.au/news-and-publications/apra-letter-industry-artificial-intelligence-ai"], ["OBL-AU-APRA-AI-03", "AI governance arrangements, lifecycle ownership, inventory and training", "APRA Letter to Industry on Artificial Intelligence (AI)", "Letter, governance expectations ('APRA expects entities to establish consistent governance arrangements that include, at a minimum:')", "inForce", "https://www.apra.gov.au/news-and-publications/apra-letter-industry-artificial-intelligence-ai"], ["OBL-AU-APRA-AI-09", "AI assurance and continuous monitoring", "APRA Letter to Industry on Artificial Intelligence (AI)", "Letter, assurance expectations ('This would include at a minimum:')", "inForce", "https://www.apra.gov.au/news-and-publications/apra-letter-industry-artificial-intelligence-ai"], ["OBL-AU-DISR-AI-ADOPTION", "Six essential practices for responsible AI adoption", "Guidance for AI Adoption (Foundations and Implementation Practices)", "Essential practices 1-6", "inForce", "https://www.industry.gov.au/publications/guidance-ai-adoption"], ["OBL-INT-ISO42001", "AI management system standard", "ISO/IEC 42001:2023 Information technology - Artificial intelligence - Management system", "Whole standard (clauses 4-10, Annex A controls)", "inForce", "https://www.iso.org/standard/42001"], ["OBL-INT-NIST-AIRMF", "NIST AI RMF and Generative AI Profile", "NIST AI Risk Management Framework 1.0 (NIST AI 100-1) and Generative AI Profile (NIST AI 600-1)", "Core functions: Govern, Map, Measure, Manage", "inForce", "https://www.nist.gov/itl/ai-risk-management-framework"]]}, {"tier": "Anticipated", "refs": [["OBL-AU-PRIVACY-APP1-7", "Privacy policy disclosure of automated decisions (APP 1.7-1.9)", "Privacy Act 1988 (Cth), Schedule 1 (APPs), as amended by the Privacy and Other Legislation Amendment Act 2024", "APP 1.7, 1.8, 1.9 (inserted by POLA Act 2024 Sch 1 Part 15, item 88; application item 89)", "pending", "https://legislation.gov.au/C2024A00128/asmade/2024-12-10/text/original/epub/OEBPS/document_1/document_1.html"]]}], "questions": [{"about": "UC3", "question": "Measured against the client’s own thresholds, which consequence level (C1 to C5) should counsel set for UC3 (Automated triage or decline)?"}, {"about": "UC7", "question": "Measured against the client’s own thresholds, which consequence level (C1 to C5) should counsel set for UC7 (AI inside a provider or the platform behind it)?"}, {"about": "OBL-AU-FAR-20", "question": "Does Financial Accountability Regime Act 2023 (Cth) reach the client’s arrangements for the selected use cases, and if so, what do its provisions call for?"}, {"about": "OBL-AU-CPS220-9", "question": "Does Prudential Standard CPS 220 Risk Management reach the client’s arrangements for the selected use cases, and if so, what do its provisions call for?"}, {"about": "OBL-AU-CPS230-20", "question": "Does Prudential Standard CPS 230 Operational Risk Management reach the client’s arrangements for the selected use cases, and if so, what do its provisions call for?"}, {"about": "OBL-AU-CPS234-13", "question": "Does Prudential Standard CPS 234 Information Security reach the client’s arrangements for the selected use cases, and if so, what do its provisions call for?"}, {"about": "OBL-AU-APRA-AI-01", "question": "What weight should the client give to APRA Letter to Industry on Artificial Intelligence (AI) (APRA) in its approach to the selected use cases?"}, {"about": "OBL-AU-DISR-AI-ADOPTION", "question": "What weight should the client give to Guidance for AI Adoption (Foundations and Implementation Practices) (National Artificial Intelligence Centre (Department of Industry, Science and Resources)) in its approach to the selected use cases?"}, {"about": "OBL-AU-OAIC-APP1-GUIDE", "question": "What weight should the client give to OAIC APP Guidelines Chapter 1 (APP 1) update and APP 1.7-1.9 Transparency Obligation Fact Sheet and Flowchart (OAIC) in its approach to the selected use cases?"}, {"about": "OBL-AU-PRIVACY-APP1-7", "question": "How should the client prepare for Privacy Act 1988 (Cth), Schedule 1 (APPs), as amended by the Privacy and Other Legislation Amendment Act 2024, which is made but not yet in force (key date 2026-12-10)?"}, {"about": "OBL-INT-ISO42001", "question": "What weight should the client give to ISO/IEC 42001:2023 Information technology - Artificial intelligence - Management system (ISO/IEC JTC 1/SC 42) in its approach to the selected use cases?"}, {"about": "OBL-INT-NIST-AIRMF", "question": "What weight should the client give to NIST AI Risk Management Framework 1.0 (NIST AI 100-1) and Generative AI Profile (NIST AI 600-1) (NIST (US Department of Commerce)) in its approach to the selected use cases?"}], "coverage": [], "notices": ["Records state what sources say and how they are classified. They are not legal advice and do not say what the law requires of any particular client; counsel decides what applies.", "Tiers describe sources: Binding (law or prudential standard in force), Expected (regulator expectation, guidance or recognised standard), Anticipated (made but not yet in force, or under consultation).", "This brief was built in the browser. The matter label, scope and consequence levels were not sent to Triodian."]},
    },
    areas,
    people: [
      P('p-chair', 'Catherine Demetriou', 'Wattlebrook Bank (board)', ['chair']),
      P('p-dir1', 'Andrew Mbeki', 'Wattlebrook Bank (board, chair of the risk committee)', ['director']),
      P('p-dir2', 'Joanne Ferreira', 'Wattlebrook Bank (board)', ['director']),
      P('p-ceo', 'Paul Sandhu', 'Wattlebrook Bank', ['ceo']),
      P('p-cro', 'Leila Haddad', 'Wattlebrook Bank', ['cro']),
      P('p-gc', 'Thomas Achterberg', 'Wattlebrook Bank', ['gc']),
      P('p-adv', 'Alex Morgan', 'Kestrel Board Advisory', ['advisor']),
      P('p-rec', 'Lee Chan', 'Triodian', ['methodOwner', 'recorder']),
      P('p-ret', 'Hannah Okonkwo', 'Wattlebrook Bank (chief retail banking officer)', ['areaOwner']),
      P('p-fc', 'Vikram Rao', 'Wattlebrook Bank (head of financial crime)', ['areaOwner']),
      P('p-coo', 'Erin Gallagher', 'Wattlebrook Bank (chief operating officer)', ['areaOwner']),
      P('p-biz', 'Gareth Nolan', 'Wattlebrook Bank (head of business banking)', ['areaOwner']),
      P('p-cio', 'Naomi Fitzgerald', 'Wattlebrook Bank (chief information officer)', ['technologyOwner']),
      P('p-aig1', 'Dylan Kruger', 'Wattlebrook Bank (AI governance)', ['aiGovernance']),
      P('p-aig2', 'Sana Malik', 'Wattlebrook Bank (AI governance)', ['aiGovernance']),
    ],
    scopeAgreed: { gcBy: 'p-gc', gcOn: '2026-10-13', chairBy: 'p-chair', chairOn: '2026-10-14' },
    // The management briefing: held before anything went to directors, and read by the CIO and the AI governance team.
    managementBriefing: { heldOn: '2026-10-08', attended: 'Alex Morgan, Thomas Achterberg and Lee Chan with Naomi Fitzgerald and the AI governance team', recordedBy: 'p-adv', notNeeded: '', confirmed: { 'p-cio': '2026-10-08', 'p-aig1': '2026-10-09', 'p-aig2': '2026-10-09' } },
    education: { 'p-chair': { readOn: '2026-10-15', completedOn: '2026-10-15' }, 'p-dir1': { readOn: '2026-10-16', completedOn: '2026-10-16' }, 'p-dir2': { readOn: '2026-10-19', completedOn: '' } },
    inventory: [
      L('L1', 'Recommending approve, refer or decline on a home loan application to a credit assessor', 'Credit decision engine (licensed)', 'A1', 'Staff', 'A2', 'G4', 'K2', true, 'p-ret', 'Credit policy, section 6, and the engine’s model document', { decisions: 'Which applications are recommended for approval, referral or decline; a credit assessor decides', personalInfo: 'Income, expenses, credit history, employment and identity details' }),
      L('L2', 'Checking serviceability on applications lodged through brokers before they reach the bank', 'The broker platform’s pre-assessment tool', 'A1', 'A provider for us', 'A2', 'G4', 'K2', false, 'p-ret', 'Broker platform agreement, schedule 2'),
      L('L3', 'Screening outgoing payments for scams and fraud, and holding those it flags', 'The payments provider’s scam screening model', 'A4', 'A provider for us', 'A3', 'G4', 'K2', true, 'p-fc', 'Payments provider’s due diligence response, Sept 2026', { decisions: 'Which payments are held for review before they are sent', personalInfo: 'Account and payee details, payment history, device and session details' }),
      L('L4', 'Monitoring transactions and raising alerts for an analyst to review', 'Transaction monitoring service (licensed)', 'A4', 'Staff', 'A2', 'G4', 'K2', false, 'p-fc', 'AML/CTF program, part A'),
      L('L5', 'Matching and posting incoming payments to customer accounts', 'The core banking provider’s matching engine', 'A2', 'A provider for us', 'A4', 'G4', 'K2', false, 'p-coo', 'Core banking services agreement, schedule 3'),
      L('L6', 'Answering customers’ general questions in the banking app', 'Banking app assistant', 'A6', 'Customers directly', 'A2', 'G4', 'K2', false, 'p-ret', 'Digital services agreement, schedule 1'),
      L('L7', 'Transcribing and summarising contact-centre calls', 'The contact-centre platform', 'A6', 'A provider for us', 'A1', 'G4', 'K2', false, 'p-ret', 'Contact-centre service description, 2026'),
      L('L8', 'Ordering which customers in arrears are contacted first, and suggesting a hardship arrangement', 'The collections agency’s workflow tool', 'A5', 'A provider for us', 'A2', 'G5', 'K2', true, 'p-ret', 'Interview with the collections agency, 7 Oct', { decisions: 'Which customers are contacted first, and which hardship arrangement is suggested to the officer', personalInfo: 'Arrears history, income and expenses, hardship circumstances' }),
      L('L9', 'Summarising business customers’ financial statements for relationship managers', 'Enterprise assistant (licensed)', 'A3', 'Staff', 'A1', 'G3', 'K1', false, 'p-biz', 'IT licence list, 6 Oct'),
      L('L10', 'Drafting emails, papers and summaries', 'Enterprise assistant (licensed)', 'A9', 'Staff', 'A1', 'G3', 'K1', false, 'p-cio', 'IT licence list, 6 Oct'),
      L('L11', 'Transcribing meetings, including committee meetings', 'Video-call platform AI notes', 'A9', 'Staff, including the credit committee', 'A1', 'G6', 'K3', false, 'p-cio', 'Interview with the CIO, 6 Oct'),
      L('L12', 'Suggesting and reviewing code', 'Code assistant (licensed)', 'A9', 'Staff', 'A1', 'G2', 'K2', false, 'p-cio', 'IT licence list, 6 Oct'),
      L('L13', 'Staff using consumer chatbots on their phones', 'Not known: any consumer tool', 'A8', 'Staff', 'A1', 'G6', 'K5', false, 'p-cio', 'Not known: CIO to survey by 13 Nov'),
    ].map((l, i) => ({ ...l, suppliedBy: i % 2 ? 'p-aig2' : 'p-aig1', ...(l.id === 'L13' ? {} : { confirmedBy: 'p-cio', confirmedOn: '2026-10-16' }) })),  // supplied by the AI governance team; L13 is not yet confirmed
    positions: {
      B2: {
        goals: [
          { id: 'GL1', goal: 'Use AI to stop more scams and answer customers faster, without it standing in for a person where credit is declined, an account is frozen or hardship is decided', owner: 'Hannah Okonkwo', measure: 'BM1: AI uses in the inventory, and how many are new since the last report', proposedBy: 'p-ceo' },
          { id: 'GL2', goal: 'No customer is declined, delayed or blocked unfairly because of AI: ours or a provider’s', owner: 'Erin Gallagher', measure: 'BM3: material AI incidents', proposedBy: 'p-dir2' },
          { id: 'GL3', goal: 'Know what AI the payments provider, the core banking provider, brokers and collections agencies use on our customers', owner: 'Leila Haddad', measure: 'BM6: material providers whose use of AI on customers is not known', proposedBy: 'p-dir1' },
        ],
        A1: { posture: 'S2', condition: 'A credit assessor decides every decline', proposedBy: 'p-dir2' },
        A2: { posture: 'S3', condition: 'Within the payment limits in the core banking agreement; a person releases any held payment', proposedBy: 'p-ceo' },
        A3: { posture: 'S2', condition: '', proposedBy: 'p-dir1' },
        A4: { posture: 'S2', condition: 'A person decides before an account is frozen or closed', proposedBy: 'p-dir2' },
        A5: { posture: 'S2', condition: 'A person decides every hardship request', proposedBy: 'p-dir2' },
        A6: { posture: 'S3', condition: 'General information only; anything about a customer’s own account or complaint goes to a person', proposedBy: 'p-ceo' },
        A7: { posture: 'S2', condition: '', proposedBy: 'p-dir1' },
        A8: { posture: 'S1', condition: '', proposedBy: 'p-chair' },
        A9: { posture: 'S3', condition: 'No AI holds credentials to production systems unattended', proposedBy: 'p-dir1' },
      },
      B3: { lines: [
        { id: 'RL1', use: 'AI making a final credit decline with no person reviewing it', scope: 'Retail lending and credit decisions; Business and institutional banking', appliesTo: 'The bank and its brokers', testedAgainst: 'none', proposedBy: 'p-dir2' },
        { id: 'RL2', use: 'AI closing or freezing a customer’s account with no person reviewing it', scope: 'Financial crime (AML/CTF, fraud and scams); Deposits and payments', appliesTo: 'The bank and its providers', testedAgainst: 'none', proposedBy: 'p-dir1' },
        { id: 'RL3', use: 'AI deciding a customer’s financial hardship request with no person reviewing it', scope: 'Collections and financial hardship', appliesTo: 'The bank and its collections agencies', testedAgainst: 'none', proposedBy: 'p-dir2' },
        { id: 'RL4', use: 'Board, credit committee or transaction information (G6) entered into any tool outside the bank’s own estate', scope: 'All areas', appliesTo: 'The bank and its advisers', testedAgainst: 'L13', proposedBy: 'p-chair' },
      ] },
      B4: { events: [
        { id: 'RV1', event: 'A new AI use at A3 (Decides) or above', timing: 'Before it starts', by: 'CEO', proposedBy: 'p-chair' },
        { id: 'RV2', event: 'A new AI use in an area marked Avoid', timing: 'Before it starts', by: 'CEO', proposedBy: 'p-chair' },
        { id: 'RV3', event: 'An exception to a red line', timing: 'Before it starts', by: 'CEO', proposedBy: 'p-dir1' },
        { id: 'RV4', event: 'The payments provider or the core banking provider changing the AI it uses on customers’ payments or accounts', timing: 'Before it starts, where the agreement allows; otherwise told at the next meeting', by: 'CRO', proposedBy: 'p-dir1' },
        { id: 'RV5', event: 'A material AI incident', timing: 'Told within 24 hours', by: 'CEO', proposedBy: 'p-dir2' },
        { id: 'RV6', event: 'A change to the directions or the measures', timing: 'Before it takes effect', by: 'Chair', proposedBy: 'p-chair' },
      ] },
      B5: {
        cells: {
          'G1:K1': 'P', 'G1:K2': 'P', 'G1:K3': 'P', 'G1:K4': 'P', 'G1:K5': 'P', 'G1:K7': 'P',
          'G2:K1': 'P', 'G2:K2': 'P', 'G2:K3': 'P', 'G2:K4': 'C', 'G2:K5': 'N', 'G2:K7': 'P',
          'G3:K1': 'P', 'G3:K2': 'C', 'G3:K3': 'C', 'G3:K4': 'N', 'G3:K5': 'N', 'G3:K7': 'C',
          'G4:K1': 'C', 'G4:K2': 'C', 'G4:K3': 'C', 'G4:K4': 'N', 'G4:K5': 'N', 'G4:K7': 'C',
          'G5:K1': 'C', 'G5:K2': 'C', 'G5:K3': 'N', 'G5:K4': 'N', 'G5:K5': 'N', 'G5:K7': 'C',
          'G6:K1': 'C', 'G6:K2': 'N', 'G6:K3': 'N', 'G6:K4': 'N', 'G6:K5': 'N', 'G6:K7': 'N',
        },
        conditions: [
          'With conditions means: only in a tool the bank or a material service provider has under agreement, that does not train on customers’ information, and only for the people who already have access to it.',
          'Customers’ hardship information (G5) goes only into a provider’s tool named in its agreement with the bank.',
          'Meeting AI may not run in board, risk committee or credit committee meetings.',
        ],
        proposedBy: 'p-chair',
      },
      B6: { harms: {
        H1: { statement: 'A customer wrongly declined credit, blocked from their money, or refused hardship help', threshold: 'Any single account wrongly frozen or hardship request wrongly declined; 25 or more customers for any other error', source: 'Conduct and breach reporting definitions', proposedBy: 'p-dir2' },
        H2: { statement: 'A staff member or applicant treated unfairly by AI', threshold: 'Any pattern across a hiring or review round', source: 'New', proposedBy: 'p-dir1' },
        H3: { statement: 'A wrong payment, or a loss to a scam the bank should have stopped', threshold: '$500,000 in a single event or $2m in a quarter', source: 'Operational risk incident thresholds', proposedBy: 'p-dir1' },
        H4: { statement: 'A critical operation stopped', threshold: 'Beyond its tolerance in the critical operations register', source: 'Critical operations register', proposedBy: 'p-ceo' },
        H5: { statement: 'A breach of a law, a licence condition or a prudential standard', threshold: 'Any', source: 'Breach reporting definitions', proposedBy: 'p-chair' },
        H6: { statement: 'A public failure attributed to our use of AI, or a provider’s on our customers', threshold: 'Any media or regulator attention', source: 'New', proposedBy: 'p-chair' },
      } },
      B7: {
        measures: [
          { id: 'BM1', measure: 'AI uses in the inventory, and how many are new since the last report', limit: 'n/a', owner: 'CEO' },
          { id: 'BM2', measure: 'Uses that cross a red line or exceed their area’s posture without board approval', limit: '0', owner: 'CEO' },
          { id: 'BM3', measure: 'Material AI incidents', limit: '0', owner: 'CEO' },
          { id: 'BM4', measure: 'Known uses of information marked N in B5', limit: '0', owner: 'CEO' },
          { id: 'BM5', measure: 'Actions on the 90-day list overdue', limit: '2', owner: 'CEO' },
          { id: 'BM6', measure: 'Material providers whose use of AI on customers is not known', limit: '0 by 30 June 2027', owner: 'CRO', goal: 'GL3' },
        ].map(m => ({ ...m, draftedBy: m.id === 'BM6' ? 'p-aig2' : 'p-aig1', confirmedBy: 'p-cio', confirmedOn: '2026-10-20' })),
        events: [
          { id: 'EV1', event: 'A material AI incident', to: 'Chair', within: '24 hours' },
          { id: 'EV2', event: 'A red line crossed', to: 'Chair', within: '24 hours' },
          { id: 'EV3', event: 'A regulator, a customer or a provider raises AI use with the bank', to: 'Chair and GC', within: '2 working days' },
          { id: 'EV4', event: 'A provider changes the AI it uses for an area marked Avoid or Cautious', to: 'CRO', within: '10 working days' },
        ],
        proposedBy: 'p-chair',
      },
      B8: {
        owners: { AC1: 'Risk committee', AC2: 'Andrew Mbeki', AC3: 'Paul Sandhu, CEO', AC4: 'Each executive for their area', AC5: 'The CEO with the CRO, for up to 90 days, reported under BM2' },
        proposedBy: 'p-chair',
      },
    },
    questions: [
      { ref: 'QC-01', step: 'B1', lines: ['L1', 'L3', 'L8'], question: 'Lines L1, L3 and L8 shape decisions about individual customers. Does the privacy policy need to describe them before 10 December 2026?', status: 'answered', response: 'Yes for L1 and L3. L8 is run by the collections agency on the bank’s behalf; Askew Lane Partners will advise on how the bank’s policy describes it by 6 November.', sentOn: '2026-10-14', respondedOn: '2026-10-19', raisedBy: 'p-rec' },
      { ref: 'QC-02', step: 'B3', question: 'Through which document can the bank hold the payments provider to red line RL2, and when can it next be changed?', status: 'answered', response: 'Through the fraud services schedule to the payments services agreement, at the renewal on 1 July 2027. Until then the provider has confirmed in writing that its model holds a payment for review and does not freeze or close an account.', sentOn: '2026-10-21', respondedOn: '2026-10-26', raisedBy: 'p-adv' },
      { ref: 'QC-03', step: 'B8', question: 'May the board leave these positions with the risk committee between reviews, or does any obligation on the bank call for the full board to set them?', status: 'open', response: '', sentOn: '2026-10-21', raisedBy: 'p-gc' },
    ],
    directions: { by: 'p-chair', on: '2026-10-28' },
    resolution: {
      by: 'p-chair', on: '2026-11-25', minuteRef: 'Board minute 2026/11-09', interval: 'Annual, with the board’s risk review',
      text: 'The board confirms the board directions BD1 to BD7 as recorded in steps B2 to B8, and approves the AI risk appetite statement prepared within them.',
    },
    versions: [], previous: null, history: [],  // versions are added below, from the record itself
  };
  // Three sign-offs, so three versions: the scope agreed, the board directions recorded (read by the AI Risk Appetite
  // app), and the resolution once the appetite statement came back to the board.
  const V = window.BDVersions, snapOf = d => (V && V.snapshotOf ? V.snapshotOf(d) : { areas: d.areas.map(a => a.name), areaIds: d.areas.map(a => a.id), engagement: { id: d.engagement.id, company: d.engagement.company, jurisdiction: 'AU', sector: d.engagement.sector, entityType: d.engagement.entityType, sectorPack: d.engagement.sectorPack, mode: d.engagement.mode }, positions: JSON.parse(JSON.stringify(d.positions)), inventoryLines: d.inventory.length, inventory: d.inventory.map(l => l.id), resolution: d.resolution.by ? { on: d.resolution.on, minuteRef: d.resolution.minuteRef } : null });
  S.versions = [
    { id: 'V1', label: 'Scope agreed (B0)', at: '2026-10-14T09:20:00Z', by: 'Catherine Demetriou', snapshot: snapOf({ ...S, positions: {}, resolution: {} }) },
    { id: 'V2', label: 'Board directions recorded', at: '2026-10-28T16:05:00Z', by: 'Catherine Demetriou', snapshot: snapOf({ ...S, resolution: {} }) },
    { id: 'V3', label: 'Resolved by the board (B9)', at: '2026-11-25T15:30:00Z', by: 'Catherine Demetriou', snapshot: snapOf(S) },
  ];
  return S;
}
window.BDExamples = (window.BDExamples || []).concat([{ id: 'banking', name: 'Bank', note: 'Worked example: a fictional bank, Wattlebrook Bank, its board and advisers, for practice only. Nothing is saved.', offer: 'A fictional bank’s board gives its directions before the AI risk appetite engagement, and approves the statement prepared within them.', build: buildBank }]);
})();
