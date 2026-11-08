/* Built from bd-content.json by tools/build-content.mjs. Do not edit. */
window.BD_CONTENT = {
  "schema": "triodian.bd.content.v1",
  "frameworkDate": "5 November 2026",
  "banner": "It records the positions the board proposes and resolves, with who proposed each one. It does not recommend what the board's position should be. Questions about the company's legal obligations are recorded for counsel to answer.",
  "modes": [
    {
      "id": "standalone",
      "name": "Standalone",
      "for": "Companies outside prudential regulation. The steps produce the whole appetite."
    },
    {
      "id": "connected",
      "name": "Connected",
      "for": "APRA, ASIC or MAS regulated entities. The steps produce board directions that the AI Risk Appetite engagement must stay within."
    }
  ],
  "entityTypes": [
    [
      "privateCompany",
      "Private company"
    ],
    [
      "listedEntity",
      "Listed entity"
    ],
    [
      "notForProfit",
      "Not-for-profit"
    ],
    [
      "criticalInfrastructureAssetOwner",
      "Critical infrastructure asset owner"
    ],
    [
      "defenceIndustrySupplier",
      "Defence industry supplier"
    ],
    [
      "healthServiceProvider",
      "Health service provider"
    ],
    [
      "authorisedDepositTakingInstitution",
      "Authorised deposit-taking institution"
    ],
    [
      "generalInsurer",
      "General insurer"
    ],
    [
      "lifeInsurer",
      "Life insurer"
    ],
    [
      "privateHealthInsurer",
      "Private health insurer"
    ],
    [
      "superannuationTrustee",
      "Superannuation trustee"
    ],
    [
      "financialServicesLicensee",
      "Financial services licensee"
    ],
    [
      "creditLicensee",
      "Credit licensee"
    ],
    [
      "bank",
      "Bank (Singapore)"
    ],
    [
      "insurer",
      "Insurer (Singapore)"
    ],
    [
      "capitalMarketsIntermediary",
      "Capital markets intermediary (Singapore)"
    ],
    [
      "paymentServiceProvider",
      "Payment service provider"
    ],
    [
      "financialInstitution",
      "Financial institution (Singapore, MAS)"
    ],
    [
      "other",
      "Other"
    ]
  ],
  "jurisdictions": [
    [
      "AU",
      "Australia"
    ],
    [
      "SG",
      "Singapore"
    ]
  ],
  "startingAreas": [
    "Customer service and communications",
    "Sales and marketing",
    "People and hiring",
    "Finance and payments",
    "Operations and production",
    "Product, research and engineering",
    "Procurement and suppliers",
    "Legal, contracts and compliance",
    "IT and security",
    "Board and executive work"
  ],
  "steps": [
    {
      "id": "B0",
      "name": "Set-up and pre-read",
      "question": "What applies to us, and what do directors need to know first?",
      "answeredAs": "Scope, mode, privilege position, matter brief",
      "position": "BP0",
      "direction": "",
      "task": "1.4"
    },
    {
      "id": "B1",
      "name": "Where AI is used",
      "question": "What AI do we use now, directly and through providers?",
      "answeredAs": "An inventory of 10 to 20 lines, each with authority level and the automated-decision flag",
      "position": "BP1",
      "direction": "Register summary",
      "task": "1.6, 1.11"
    },
    {
      "id": "B2",
      "name": "Posture",
      "question": "Where do we want AI to create value, and how cautious are we in each area?",
      "answeredAs": "A posture, Avoid to Pursue, for each area of the business",
      "position": "BP2",
      "direction": "BD1",
      "task": "1.5, 1.13",
      "prompts": [
        "Where would AI most help our people or customers? Where would we least want to see it?",
        "Is there an area where a mistake by AI would be hard to explain to customers or staff?",
        "Does any area already use AI beyond the posture we are about to set? (Compare with B1.)",
        "Are we content for providers to use AI in an area where we would not use it ourselves?"
      ],
      "start": "The current state: each area starts at the posture that matches the highest authority the inventory records there. The board confirms or changes it."
    },
    {
      "id": "B3",
      "name": "Red lines",
      "question": "Which uses of AI do we not accept at all?",
      "answeredAs": "A list of uses, each testable against the inventory",
      "position": "BP3",
      "direction": "BD2",
      "task": "1.5",
      "prompts": [
        "Is there anything we would stop at once if we found it in the inventory?",
        "Is there a decision about a person we would never let AI make alone?",
        "Is there information that must never reach any AI tool?",
        "Would we accept a provider doing something we have ruled out for ourselves?"
      ],
      "start": "None. A list of uses boards commonly consider is shown only if the board asks. Its inclusion is not a recommendation."
    },
    {
      "id": "B4",
      "name": "Reserved to the board",
      "question": "Which AI decisions must come back to us?",
      "answeredAs": "A list of events, each with who brings it and when",
      "position": "BP4",
      "direction": "BD3",
      "task": "1.5",
      "prompts": [
        "At what authority level do we want to approve a use before it starts?",
        "What can the CEO approve alone, and must it be reported?",
        "How quickly must we hear of an exception?"
      ],
      "start": "The six events RV1 to RV6, with the authority level in RV1, before or after, and who brings each left for the session."
    },
    {
      "id": "B5",
      "name": "Confidential information",
      "question": "What information may go into which AI tools?",
      "answeredAs": "Permitted, with conditions, or not permitted, for each class and tool kind",
      "position": "BP5",
      "direction": "BD4",
      "task": "1.5",
      "prompts": [
        "What do our existing confidentiality, privacy and acceptable-use policies already say? We start there.",
        "Would we know if a board paper were pasted into a chatbot on a phone?",
        "Do our advisers’ engagement letters say anything about their AI tools?",
        "Does a ban move the use somewhere we cannot see?"
      ],
      "start": "What existing policies already say. Cells no policy covers are left for the session."
    },
    {
      "id": "B6",
      "name": "Harm we will not tolerate",
      "question": "What failure would be unacceptable to customers, staff or the company?",
      "answeredAs": "A statement and a threshold for each kind of harm",
      "position": "BP6",
      "direction": "BD5",
      "task": "1.5",
      "prompts": [
        "Do we already have thresholds for incidents, losses or complaints? If so, we use them unchanged.",
        "Does one person wrongly treated count, or does it take a pattern?",
        "Which operations could an AI failure, ours or a provider’s, stop?"
      ],
      "start": "Existing incident, loss and complaint thresholds, unchanged. A new threshold is set only where none exists."
    },
    {
      "id": "B7",
      "name": "What we expect to hear",
      "question": "What should management report to us about AI, and how fast?",
      "answeredAs": "Three to five measures, and the events reported between meetings",
      "position": "BP7",
      "direction": "BD6",
      "task": "1.5",
      "prompts": [
        "Which three to five numbers would tell us whether AI is being used as we intend?",
        "What must reach the chair before the next meeting, and how fast?"
      ],
      "start": "The five measures BM1 to BM5 and four events EV1 to EV4, with limits, owners and times left for the session."
    },
    {
      "id": "B8",
      "name": "Who is accountable",
      "question": "Which committee, director and executive own AI?",
      "answeredAs": "A named owner for the whole and for each area",
      "position": "BP8",
      "direction": "BD7",
      "task": "1.5",
      "prompts": [
        "Does AI sit with the audit and risk committee, the full board, or a new committee?",
        "Is the accountable executive the one closest to the technology, or to the risk?",
        "In connected mode: does the AI owner match the accountability map, and the accountable persons under it?"
      ],
      "start": "The existing committee charter and delegations."
    },
    {
      "id": "B9",
      "name": "Resolve and review",
      "question": "Do we resolve this, and when do we look again?",
      "answeredAs": "A resolution, a review interval and change events",
      "position": "BP9",
      "direction": "Approval session",
      "task": "1.5"
    }
  ],
  "scales": {
    "posture": [
      [
        "S1",
        "Avoid",
        "We do not want AI used in this area beyond what assists a person, for now"
      ],
      [
        "S2",
        "Cautious",
        "We accept AI that assists or recommends. A person decides"
      ],
      [
        "S3",
        "Open",
        "We accept AI that decides within stated limits, where we can see what it did"
      ],
      [
        "S4",
        "Pursue",
        "We want AI used here and accept that it may act with less oversight, within our red lines and reserved decisions"
      ]
    ],
    "authority": [
      [
        "A1",
        "Assists",
        "Drafts, summarises, searches. A person still acts"
      ],
      [
        "A2",
        "Recommends",
        "Scores, ranks, recommends. A person decides"
      ],
      [
        "A3",
        "Decides",
        "Approves, declines, triages. No person reviews before it takes effect"
      ],
      [
        "A4",
        "Moves money",
        "Prices, allocates, pays"
      ],
      [
        "A5",
        "Acts unattended",
        "Plans and acts across steps and tools, unattended"
      ],
      [
        "A6",
        "Changes systems",
        "Holds credentials that change systems, assets or infrastructure"
      ]
    ],
    "harm": [
      [
        "H1",
        "Customers or members"
      ],
      [
        "H2",
        "Staff and applicants"
      ],
      [
        "H3",
        "The company’s money"
      ],
      [
        "H4",
        "Operations"
      ],
      [
        "H5",
        "Legal and regulatory standing"
      ],
      [
        "H6",
        "Reputation and trust"
      ]
    ],
    "infoClass": [
      [
        "G1",
        "Public"
      ],
      [
        "G2",
        "Internal"
      ],
      [
        "G3",
        "Commercial in confidence"
      ],
      [
        "G4",
        "Personal information"
      ],
      [
        "G5",
        "Restricted"
      ],
      [
        "G6",
        "Board and transaction"
      ]
    ],
    "toolKind": [
      [
        "K1",
        "Enterprise assistant"
      ],
      [
        "K2",
        "Sanctioned tool"
      ],
      [
        "K3",
        "Meeting AI"
      ],
      [
        "K4",
        "Unsanctioned, managed device"
      ],
      [
        "K5",
        "Personal device"
      ],
      [
        "K7",
        "Adviser’s tools"
      ]
    ],
    "mark": [
      [
        "P",
        "Permitted"
      ],
      [
        "C",
        "With conditions"
      ],
      [
        "N",
        "Not permitted"
      ]
    ],
    "accountability": [
      [
        "AC1",
        "Board committee that oversees AI"
      ],
      [
        "AC2",
        "Director who leads on AI"
      ],
      [
        "AC3",
        "Executive accountable for AI overall"
      ],
      [
        "AC4",
        "Owner of each area’s positions"
      ],
      [
        "AC5",
        "Who may approve an exception, and within what limit"
      ]
    ]
  },
  "tips": {
    "mark": {
      "P": "Permitted: this information may go into this kind of tool.",
      "C": "Permitted with conditions: only as the conditions under the table allow.",
      "N": "Not permitted: this information must not go into this kind of tool."
    },
    "infoClass": {
      "G1": "Public: material already published, such as the website or annual report.",
      "G2": "Internal: ordinary working documents that are not sensitive.",
      "G3": "Commercial in confidence: pricing, contracts, tenders and supplier terms.",
      "G4": "Personal information: records about customers, staff and job applicants.",
      "G5": "Restricted: health information, legal advice, export-controlled or security-classified material, and trade secrets.",
      "G6": "Board and transaction: board papers, strategy, and deal or price-sensitive information."
    },
    "toolKind": {
      "K1": "An enterprise assistant that can answer from the company’s own stored files and email, within each person’s access.",
      "K2": "A licensed AI tool the company has approved, which works on what a person types or uploads.",
      "K3": "AI inside meeting and collaboration tools: transcription, recaps and AI notetakers.",
      "K4": "A consumer AI tool, not approved by the company, opened in the browser on a company device.",
      "K5": "AI on a personal phone or computer, outside the company’s controls.",
      "K7": "An adviser’s own AI tools: the bank, law firm or consultant working for the company."
    },
    "ref": {
      "L": "A line in the AI inventory (step B1): one AI use the company has now.",
      "RL": "A red line (step B3): a use of AI the board does not accept at all.",
      "RV": "A decision reserved to the board (step B4): it comes back to the board before or after it happens.",
      "BM": "A board measure (step B7): reported to the board at each meeting.",
      "EV": "An event (step B7) that must reach the board between meetings, within the time shown.",
      "QC": "A question to counsel: a legal point logged for the GC to answer, not settled in the room.",
      "GL": "A governance goal (step B2): what the board wants AI governance to achieve, with an owner and a measure B7 reports."
    },
    "adm": "Whether this AI makes, or substantially contributes to, a decision about a person using their personal information. Australia’s Privacy Act requires these to be described in the privacy policy from 10 December 2026; counsel decides what that means for each line.",
    "reality": "Inventory lines that already go past a position the board has set. They are not failures: each one becomes an action on the 90-day list, so the board takes its positions knowing what they mean today.",
    "recorded": "Something has been recorded for this step.",
    "notYet": "Nothing has been recorded for this step yet.",
    "notSet": "Not set: the room could not settle this position. It is recorded with who will set it and by when, so nothing is left blank."
  },
  "starting": {
    "goals": [
      "Use AI where it creates value for customers, staff or the company, safely",
      "Keep the trust of customers, staff and the community in how we use AI",
      "Meet our obligations on AI, as counsel advises",
      "Keep operating if an AI provider fails or changes its service"
    ],
    "redLineCandidates": [
      "AI making a final decision to hire, dismiss or discipline a person, with no person reviewing it",
      "AI-written content sent to customers as if a person wrote it",
      "G6 information entered into any tool outside the company’s own estate",
      "AI holding credentials to make payments or change production systems unattended",
      "Biometric identification or monitoring of staff or customers",
      "Personal information used to train an external model",
      "AI monitoring staff communications without notice to them"
    ],
    "reserved": [
      [
        "RV1",
        "A new AI use at or above [authority level]"
      ],
      [
        "RV2",
        "A new AI use in an area marked Avoid"
      ],
      [
        "RV3",
        "An exception to a red line"
      ],
      [
        "RV4",
        "A new provider whose AI sees G5 or G6 information"
      ],
      [
        "RV5",
        "A material AI incident (as defined at B6)"
      ],
      [
        "RV6",
        "A change to the statement or the measures"
      ]
    ],
    "measures": [
      [
        "BM1",
        "AI uses in the inventory, and how many are new since the last report",
        "n/a"
      ],
      [
        "BM2",
        "Uses that cross a red line or exceed their area’s posture without board approval",
        "0"
      ],
      [
        "BM3",
        "Material AI incidents",
        "0"
      ],
      [
        "BM4",
        "Known uses of information marked N in B5",
        "0"
      ],
      [
        "BM5",
        "Actions on the 90-day list overdue",
        ""
      ]
    ],
    "events": [
      [
        "EV1",
        "A material AI incident",
        "Chair"
      ],
      [
        "EV2",
        "A red line crossed",
        "Chair"
      ],
      [
        "EV3",
        "A regulator, customer or counterparty raises AI use with the company",
        "Chair and GC"
      ],
      [
        "EV4",
        "A provider changes the AI it uses for an area marked Avoid or Cautious",
        "Accountable executive"
      ]
    ],
    "thresholdHints": {
      "H1": "Number affected, or kind of harm",
      "H2": "Number affected, or kind of harm",
      "H3": "Amount per event and per year",
      "H4": "Service and duration",
      "H5": "Kind of breach",
      "H6": "Description"
    }
  },
  "briefing": {
    "title": "Director briefing",
    "intro": "Every director starts the workshop from the same place. This briefing takes about fifteen minutes: AI in plain terms, the obligations in scope for the company, how directors’ duties bear on AI, and the ways AI commonly fails. It ends with four questions that check understanding. They are not a test, and no one else on the board sees your answers.",
    "status": "Drafted by Triodian for the board advisor, and settled by the GC before it is issued. It is not legal advice.",
    "sections": [
      {
        "h": "AI in plain terms",
        "p": [
          "In this engagement, AI means software that produces text, scores, recommendations, decisions or actions from patterns in data, rather than from rules a person wrote out. It includes tools staff use directly, such as chat assistants and meeting notes, and the AI that providers use in the work they do for the company.",
          "What matters to the board is less how the technology works than what it is allowed to do. The framework puts that on one scale, from Assists (a person still acts) to Changes systems (the AI holds credentials to change systems unattended). Much of the risk sits in the step from Recommends to Decides: the point at which no person reviews the output before it takes effect.",
          "AI can be wrong in ways that look right. It can state things that are not true, treat similar people differently, pass on information it was given, or behave differently after its provider updates it. None of these needs a fault in the company’s own systems."
        ]
      },
      {
        "h": "Directors’ duties and AI",
        "p": [
          "The board oversees AI in the way it oversees the rest of the business: by setting direction, knowing what is in use, and expecting to hear when something goes wrong. Directors do not need to understand how a model works. They need to know where AI is used, what it is allowed to do, and who answers for it.",
          "What directors’ duties require of this board in relation to AI, and whether any obligation in scope calls for a board-level position, are questions for counsel. The GC will brief the board on them before the workshop. Nothing in this briefing says what the law requires."
        ]
      },
      {
        "h": "Common ways AI fails",
        "list": [
          "A customer is given wrong information by a chatbot and relies on it.",
          "An applicant or customer is screened out by a scoring tool no one reviews.",
          "A board paper or price-sensitive document is pasted into a public chatbot.",
          "A provider changes the AI behind a service without telling the company.",
          "An automated payment or order runs on a wrong figure, again and again, before anyone notices.",
          "Staff use unapproved AI tools because the approved ones do not meet their needs."
        ]
      }
    ],
    "obligationsNote": "From the AI Obligations Atlas matter brief. The tiers describe sources, not what applies: Binding is law or a prudential standard in force; Expected is regulator guidance or a recognised standard; Anticipated is made but not yet in force, or under consultation. Counsel decides what applies to the company.",
    "checksIntro": "A check of understanding, not a test. Choose an answer to see the explanation. Only you and the facilitators (the board advisor and Triodian) see your answers.",
    "checks": [
      {
        "id": "q1",
        "q": "An AI tool shortlists job applicants and a recruiter decides whom to interview. Which authority level is that?",
        "options": [
          [
            "A1",
            "A1 Assists"
          ],
          [
            "A2",
            "A2 Recommends"
          ],
          [
            "A3",
            "A3 Decides"
          ]
        ],
        "answer": "A2",
        "why": "The AI ranks and a person decides, so it is Recommends (A2). It would be Decides (A3) if no person reviewed the shortlist before it took effect."
      },
      {
        "id": "q2",
        "q": "Which posture accepts AI that decides within stated limits, where the board can see what it did?",
        "options": [
          [
            "S1",
            "Avoid"
          ],
          [
            "S2",
            "Cautious"
          ],
          [
            "S3",
            "Open"
          ],
          [
            "S4",
            "Pursue"
          ]
        ],
        "answer": "S3",
        "why": "Open (S3). Cautious accepts AI that assists or recommends, with a person deciding. Pursue accepts less oversight, within the red lines and reserved decisions."
      },
      {
        "id": "q3",
        "q": "In the workshop, who proposes where a position is set?",
        "options": [
          [
            "a",
            "The board advisor or the GC"
          ],
          [
            "b",
            "A director, the chair or the CEO"
          ],
          [
            "c",
            "Triodian"
          ]
        ],
        "answer": "b",
        "why": "Positions come from the board and management. The board advisor, the GC and Triodian explain, answer questions and record."
      },
      {
        "id": "q4",
        "q": "A director asks whether the company must tell customers about a decision AI made. What happens in the workshop?",
        "options": [
          [
            "a",
            "The room settles it and moves on"
          ],
          [
            "b",
            "It is logged as a question to counsel"
          ],
          [
            "c",
            "Triodian gives a view"
          ]
        ],
        "answer": "b",
        "why": "Anything that turns on what the company is obliged to do is logged as a numbered question to counsel, and not settled in the room."
      }
    ]
  },
  "atlasBriefUrl": "https://obligations-atlas.triodian.com/#/brief",
  "resolution": {
    "starting": "The board resolves the AI risk appetite statement as recorded in steps B2 to B8, and directs the CEO to complete the 90-day action list.",
    "startingConnected": "The board confirms the board directions BD1 to BD7 as recorded in steps B2 to B8, and approves the AI risk appetite statement prepared within them.",
    "interval": "Annual, with the board’s risk review",
    "changeEvents": [
      [
        "CE1",
        "A material AI incident",
        "B3, B5, B6 and B7"
      ],
      [
        "CE2",
        "A new AI use at or above the RV1 level",
        "That use, against B2 to B5, before it starts"
      ],
      [
        "CE3",
        "A change in the company’s regulatory position",
        "The mode; a connected engagement if the company becomes regulated"
      ],
      [
        "CE4",
        "New law or regulator guidance on AI, as counsel advises",
        "All steps, on counsel’s advice"
      ],
      [
        "CE5",
        "The review interval has passed",
        "All steps"
      ]
    ]
  },
  "sectorPacks": [
    {
      "id": "general",
      "name": "General (any organisation)",
      "mode": "both",
      "entityTypes": [],
      "note": "The general list from the framework, Appendix A.1. Change it to the company’s own areas.",
      "areas": null,
      "briefingHeading": "",
      "failures": [],
      "redLineCandidates": []
    },
    {
      "id": "generalInsurer",
      "name": "General insurer",
      "mode": "connected",
      "entityTypes": [
        "generalInsurer"
      ],
      "note": "The nine functions match the general insurer list in the AI Risk Appetite app, so each direction reads across to the same functions there.",
      "areas": [
        "Underwriting and pricing",
        "Claims",
        "Fraud and investigations",
        "Policy administration",
        "Complaints and disputes",
        "Customer communications",
        "Finance and reserving",
        "Legal and compliance",
        "Technology operations"
      ],
      "briefingHeading": "Common failures in general insurance",
      "failures": [
        "A pricing model sets premiums that treat a group of customers unfairly, and no one notices until complaints arrive.",
        "AI in claims triage delays or declines valid claims, and customers in hardship are not picked up.",
        "A fraud model flags genuine claimants, who are then investigated without cause.",
        "A provider’s AI in claims or policy administration behaves differently after an update the insurer did not hear about."
      ],
      "redLineCandidates": [
        "AI declining a claim with no person reviewing the decision",
        "AI deciding a claimant is fraudulent with no person reviewing it"
      ]
    },
    {
      "id": "superTrustee",
      "name": "Superannuation trustee",
      "mode": "connected",
      "entityTypes": [
        "superannuationTrustee"
      ],
      "sectors": [
        "AU-SUPERANNUATION"
      ],
      "note": "Drafted for an RSE licensee, first for an ART engagement. The nine areas match the superannuation trustee list in the AI Risk Appetite app, so each direction reads across to the same functions there.",
      "areas": [
        "Member services and communications",
        "Claims and group insurance",
        "Advice",
        "Investments",
        "Administration and payments",
        "Complaints and disputes",
        "Finance and reporting",
        "Legal and compliance",
        "Technology operations"
      ],
      "briefingHeading": "Common failures in superannuation",
      "failures": [
        "AI in claims triage delays or declines a valid death or disablement claim, and a member in hardship waits without being picked up.",
        "A chatbot or digital adviser gives a member general information that reads as personal advice, or wrong information about their options.",
        "AI in benefit payments or rollovers pays the wrong amount or the wrong person, or releases money to a scammer.",
        "The administrator’s or the group insurer’s AI behaves differently after an update the trustee did not hear about."
      ],
      "redLineCandidates": [
        "AI declining a death or disablement claim with no person reviewing it",
        "AI deciding a member’s severe financial hardship release with no person reviewing it"
      ]
    },
    {
      "id": "adi",
      "name": "Authorised deposit-taking institution",
      "mode": "connected",
      "entityTypes": [
        "authorisedDepositTakingInstitution"
      ],
      "sectors": [
        "AU-BANKING"
      ],
      "note": "Drafted for an ADI. The nine areas match the ADI functions in the AI Risk Appetite app, so each direction reads across to the same functions there.",
      "areas": [
        "Retail lending and credit decisions",
        "Deposits and payments",
        "Business and institutional banking",
        "Financial crime (AML/CTF, fraud and scams)",
        "Collections and financial hardship",
        "Customer service and complaints",
        "Treasury, markets and finance",
        "Risk, legal and compliance",
        "Technology and operations"
      ],
      "briefingHeading": "Common failures in banking",
      "failures": [
        "A credit model declines or prices applicants unfairly, and the reasons cannot be explained to them.",
        "A fraud or scam model blocks legitimate payments, or misses scam payments it should stop.",
        "A chatbot gives a customer in financial hardship wrong information about their options.",
        "Transaction monitoring that relies on AI misses reportable activity after a model change."
      ],
      "redLineCandidates": [
        "AI making a final credit decline with no person reviewing it",
        "AI closing or freezing a customer’s account with no person reviewing it"
      ]
    },
    {
      "id": "masFi",
      "name": "Financial institution (Singapore, MAS)",
      "mode": "connected",
      "entityTypes": [
        "financialInstitution"
      ],
      "sectors": [
        "SG-BANKING",
        "SG-INSURANCE",
        "SG-CAPITAL-MARKETS",
        "SG-PAYMENTS"
      ],
      "note": "Drafted for a financial institution regulated by MAS. The nine areas match the MAS pack's functions in the AI Risk Appetite app, so each direction reads across to the same functions there.",
      "areas": [
        "Retail banking and lending",
        "Wealth management and advisory",
        "Insurance (where licensed)",
        "Payments and deposits",
        "Financial crime (AML/CFT, fraud and scams)",
        "Customer service and complaints",
        "Treasury, markets and finance",
        "Risk, legal and compliance",
        "Technology and operations"
      ],
      "briefingHeading": "Common failures in financial institutions",
      "failures": [
        "Several critical services rely on one AI provider, so one outage or change affects them all at once.",
        "An AI tool recommends investment products that do not suit the customer.",
        "A provider changes or retrains a model without the institution assessing the change.",
        "A credit or fraud model treats a group of customers unfairly."
      ],
      "redLineCandidates": [
        "AI giving a customer personalised investment advice with no representative reviewing it",
        "Critical services depending on a single AI provider with no plan to replace it"
      ]
    }
  ],
  "sectorPacksNote": "A sector pack gives the starting areas of the business, the failure cases in the director briefing and the uses boards commonly consider at B3. Drafted by Triodian; counsel reviews each pack’s wording.",
  "regulatedSectorsSource": "Triodian Metamodel 2.5.0, reference-data/regulated-sectors.json",
  "regulatedSectors": [
    {
      "id": "AU-BANKING",
      "jurisdiction": "AU",
      "name": "Banking",
      "entityTypes": [
        "authorisedDepositTakingInstitution"
      ],
      "financiallyRegulated": true
    },
    {
      "id": "AU-INSURANCE",
      "jurisdiction": "AU",
      "name": "Insurance",
      "entityTypes": [
        "generalInsurer",
        "lifeInsurer",
        "privateHealthInsurer"
      ],
      "financiallyRegulated": true
    },
    {
      "id": "AU-SUPERANNUATION",
      "jurisdiction": "AU",
      "name": "Superannuation",
      "entityTypes": [
        "superannuationTrustee"
      ],
      "financiallyRegulated": true
    },
    {
      "id": "AU-FINANCIAL-SERVICES",
      "jurisdiction": "AU",
      "name": "Financial services and markets",
      "entityTypes": [
        "financialServicesLicensee"
      ],
      "financiallyRegulated": true
    },
    {
      "id": "AU-CREDIT",
      "jurisdiction": "AU",
      "name": "Credit",
      "entityTypes": [
        "creditLicensee"
      ],
      "financiallyRegulated": true
    },
    {
      "id": "AU-PAYMENTS",
      "jurisdiction": "AU",
      "name": "Payments",
      "entityTypes": [
        "paymentServiceProvider"
      ],
      "financiallyRegulated": true
    },
    {
      "id": "AU-LISTED",
      "jurisdiction": "AU",
      "name": "Listed companies",
      "entityTypes": [
        "listedEntity"
      ],
      "financiallyRegulated": false
    },
    {
      "id": "AU-HEALTH",
      "jurisdiction": "AU",
      "name": "Health",
      "entityTypes": [
        "healthServiceProvider"
      ],
      "financiallyRegulated": false
    },
    {
      "id": "AU-CRITICAL-INFRASTRUCTURE",
      "jurisdiction": "AU",
      "name": "Critical infrastructure",
      "entityTypes": [
        "criticalInfrastructureAssetOwner"
      ],
      "financiallyRegulated": false
    },
    {
      "id": "AU-DEFENCE",
      "jurisdiction": "AU",
      "name": "Defence industry",
      "entityTypes": [
        "defenceIndustrySupplier"
      ],
      "financiallyRegulated": false
    },
    {
      "id": "AU-GENERAL",
      "jurisdiction": "AU",
      "name": "Not financially regulated",
      "entityTypes": [
        "privateCompany",
        "notForProfit"
      ],
      "financiallyRegulated": false
    },
    {
      "id": "SG-BANKING",
      "jurisdiction": "SG",
      "name": "Banking",
      "entityTypes": [
        "bank"
      ],
      "alsoReaches": [
        "financialInstitution"
      ],
      "financiallyRegulated": true
    },
    {
      "id": "SG-INSURANCE",
      "jurisdiction": "SG",
      "name": "Insurance",
      "entityTypes": [
        "insurer"
      ],
      "alsoReaches": [
        "financialInstitution"
      ],
      "financiallyRegulated": true
    },
    {
      "id": "SG-CAPITAL-MARKETS",
      "jurisdiction": "SG",
      "name": "Capital markets",
      "entityTypes": [
        "capitalMarketsIntermediary"
      ],
      "alsoReaches": [
        "financialInstitution"
      ],
      "financiallyRegulated": true
    },
    {
      "id": "SG-PAYMENTS",
      "jurisdiction": "SG",
      "name": "Payments",
      "entityTypes": [
        "paymentServiceProvider"
      ],
      "alsoReaches": [
        "financialInstitution"
      ],
      "financiallyRegulated": true
    },
    {
      "id": "SG-LISTED",
      "jurisdiction": "SG",
      "name": "Listed companies",
      "entityTypes": [
        "listedEntity"
      ],
      "financiallyRegulated": false
    },
    {
      "id": "SG-HEALTH",
      "jurisdiction": "SG",
      "name": "Health",
      "entityTypes": [
        "healthServiceProvider"
      ],
      "financiallyRegulated": false
    },
    {
      "id": "SG-CRITICAL-INFRASTRUCTURE",
      "jurisdiction": "SG",
      "name": "Critical infrastructure",
      "entityTypes": [
        "criticalInfrastructureAssetOwner"
      ],
      "financiallyRegulated": false
    },
    {
      "id": "SG-DEFENCE",
      "jurisdiction": "SG",
      "name": "Defence industry",
      "entityTypes": [
        "defenceIndustrySupplier"
      ],
      "financiallyRegulated": false
    },
    {
      "id": "SG-GENERAL",
      "jurisdiction": "SG",
      "name": "Not financially regulated",
      "entityTypes": [
        "privateCompany",
        "notForProfit"
      ],
      "financiallyRegulated": false
    }
  ]
};
