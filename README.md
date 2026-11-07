# AI Board Direction

[![Tests](https://github.com/Triodian/board-direction/actions/workflows/tests.yml/badge.svg)](https://github.com/Triodian/board-direction/actions/workflows/tests.yml) [![Licence: Apache 2.0](https://img.shields.io/badge/licence-Apache%202.0-blue.svg)](LICENSE)

AI Board Direction takes a company's board from "what AI do we use?" to a resolved position on AI: where the board
wants AI used, what it will not accept, what must come back to it, what information may go where, and who is
accountable. The board works through ten steps, B0 to B9, facilitated by its board advisor and general counsel, and
resolves the result at a board meeting. The app records the positions, checks them for consistency and produces the
statement, the board minute, a policy outline and a 90-day action list.

It runs in two modes. **Standalone**, for companies outside prudential regulation, produces the whole appetite.
**Connected**, for APRA, ASIC or MAS regulated entities, produces board directions that the
[AI Risk Appetite](https://github.com/Triodian/risk_appetite) engagement must stay within.

> The app records facts and the positions people take. It is not legal advice and does not say what the law requires;
> counsel decides what applies.

**Try it.** The demo runs at [board-direction.triodian.com](https://board-direction.triodian.com), with a worked example you can open without changing
anything. Ask Triodian for the demo sign-in.

**Run it yourself.** It runs as a Cloudflare Worker with a D1 database. See [Running locally](#running-locally) and
[Tests](#tests) below, and the [installer](https://github.com/Triodian/triodian-install) to put it into your own
Cloudflare account.

## Part of the Triodian AI governance apps

| App | What it is for |
| --- | --- |
| [AI Obligations Atlas](https://github.com/Triodian/obligations-atlas) | The AI governance obligations that apply by jurisdiction and use case, tiered by source, with a matter brief for counsel |
| [AI Board Direction](https://github.com/Triodian/board-direction) | A board sets its direction on AI: where to use it, what to rule out, what comes back to the board |
| [AI Risk Appetite](https://github.com/Triodian/risk_appetite) | A regulated entity settles its appetite for AI risk, for the board to approve |
| [AI Use Assessment](https://github.com/Triodian/use-assessment) | The AI in a regulated entity's supply chain, measured against that appetite |
| [AI Confidentiality Exposure Assessment](https://github.com/Triodian/Confidentiality-Exposure-Assessment) | Where confidential information in one transaction can reach an external AI model |
| [Installer and suite test](https://github.com/Triodian/triodian-install) | Puts the apps a client needs into a Cloudflare account, and tests them together |

The engagement apps are separate, each with its own repo and database. Deployed together they share one sign-in and
reach each other through Cloudflare service bindings.

## How it is built

Single-engagement web app: each deployment holds one board engagement for one company. It takes a board through the
ten steps of the Board AI Appetite Framework, B0 to B9, facilitated by the board advisor and the general counsel, with
Triodian recording. It runs as a Cloudflare Worker: the files in `public/` are served as static assets, and
`src/worker.js` handles `/api/*`. The server design is the AI Confidentiality Exposure Assessment app's
(`Triodian/confidentiality-exposure-assessment`), which shares the AI Use Assessment's.

- `public/` – the app
  - `/` – the engagement (`index.html`, `bd.js`, `bd-content.js`, `app.css`) and the worked example (`bd-example.js`: a fictional company, browser only, never saved)
  - `/shared/rules.js` – the roles and per-change permission rules, one copy read by the browser and the server
  - `/bd-outputs.js` – the outputs (framework section 8): statement, directions paper, policy outline, minute, 90-day list, engagement plan, confidentiality position file; unit tests in `tests/outputs.test.mjs`
  - `/shared/versions.js` – the version snapshot and the comparison with now, shared by the server (`lib/core/versions.js`) and the browser
  - `/shared/checks.js` – the checks BK1 to BK7 (framework 10.1), run in the browser as positions change; unit tests in `tests/checks.test.mjs`
  - `/shared/matter-brief.js` – reads an AI Obligations Atlas matter brief (`triodian.matterBrief/1`) for B0; browser and server
  - `/admin/` – users, their roles, access requests and activity (administrators only), from `account.js`
  - `/profile/` – your name, organisation, email address and preferences, from `account.js`
  - `/user-guide/` – the user guide
- `src/worker.js` – Cloudflare entry point
- `lib/core/` – cloud-neutral API (`api.js`), the server-side save check (`rbac.js`), versions, the next review
  (`review.js`), notifications, three-way merge
- `lib/identity/session.js` – the `/login` page's sign-in, sessions and the page gate; `lib/identity/cloudflare-access.js` verifies the Access token on `/auth/email`
- `public/login/` – the sign-in page
- `lib/store/d1.js` – database access (Cloudflare D1)
- `lib/config.js` – Access team domain and AUD tag, first administrator
- `wrangler.jsonc` – Worker configuration: `board-direction.triodian.com` (database `board-direction-db`) and the test
  site `board-direction-test.triodian.com` (database `board-direction-test-db`)
- `public/bd-content.json` – steps, modes, entity types and starting areas. Change wording there, then run
  `node tools/build-content.mjs` to rebuild `bd-content.js`

## The engagement document (schema `triodian.bd.v1`)
`engagement` (company, entity type, jurisdiction, mode, reference, privilege marking, practitioner, board dates),
`areas`, `scopeAgreed` (B0), `inventory` (B1), `positions` (B2 to B8), `questions` (to counsel), `resolution` (B9),
`education` (B0: each director's briefing read and completion dates), `versions`, `previous`, `history`. See the comment
at the top of `public/shared/rules.js`. The matter brief is kept at `engagement.matterBrief` without the lawyer's matter label.

## The director briefing (B0)
Directors' answers to the check questions are not in the engagement document. They are kept in the `briefing_answers`
table and served by `GET /api/briefing`: each director receives only their own, the board advisor and Triodian receive
all. `PUT /api/briefing` (chair and directors only) saves a director's answers and read confirmation and sets their
dates in `education`; a normal save cannot change `education`.

## Roles
Method owner and recorder (Triodian), board advisor, general counsel, chair, director, CEO or accountable executive,
CRO (connected mode only), area owner. A person may hold several. Positions at B2 to B8 may be recorded by the board,
the CEO or Triodian, and must name as proposer a director, the chair, the CEO or, in connected mode, the CRO. The
board advisor and the GC do not propose positions. Only the GC answers questions to counsel; only the chair records
the resolution. The mode is fixed once the inventory has a line.

## Setting up a deployment
Done for `board-direction`: databases created, Access application created and its AUD tag in `lib/config.js`.
Connect the repository to Cloudflare Workers Builds (`main` → live, `test` → test site with `--env test`). The first
person in `BOOTSTRAP_ADMINS` to sign in becomes the administrator and adds everyone else in Admin.

People sign in at `/login`: with email (Cloudflare Access guards `/auth/email` only, then the app keeps its own 12-hour session) or with the shared demo account trio_demo. The demo cookie is checked with `DEMO_SESSION_KEY`, a Worker secret on this app (the same value as the other Triodian apps), not a value in `wrangler.jsonc`. There are no demo administrators: add demo@triodian.com in Admin to give the demo account a role.

## Tests
```
for f in tests/*.test.mjs; do node "$f"; done
cd tests/e2e && npm ci && npx playwright install chromium && npx playwright test
```

## Running locally
```
npx wrangler dev --local-upstream localhost --var LOCAL_DEV_NO_SIGNIN_EMAIL:you@example.com
```
`LOCAL_DEV_NO_SIGNIN_EMAIL` only works on localhost. Locally, an `X-Dev-User` header picks a different user for testing.

## Contributing

Contributions are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md) and the [code of conduct](CODE_OF_CONDUCT.md).
Report security problems privately, as [SECURITY.md](SECURITY.md) describes, not as issues.

## Supporting the project

This is one of five open-source apps from Triodian. There are four ways to help: use it, contribute to it, review it, or adopt it in your own work. See [SUPPORTING.md](SUPPORTING.md).

## Licence

AI Board Direction is open source under the [Apache License, Version 2.0](LICENSE). Copyright 2026 Triodian Pty Ltd.
Third-party components bundled with it keep their own licences; see [`NOTICE`](NOTICE).
