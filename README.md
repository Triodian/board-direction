# AI Board Direction (Triodian)

Single-engagement web app: each deployment holds one board engagement for one company. It takes a board through the
ten steps of the Board AI Appetite Framework, B0 to B9, facilitated by the board advisor and the general counsel, with
Triodian recording. It runs as a Cloudflare Worker: the files in `public/` are served as static assets, and
`src/worker.js` handles `/api/*`. The server design is the AI Confidentiality Exposure Assessment app's
(`Triodian/confidentiality-exposure-assessment`), which shares the AI Use Assessment's.

**Status:** development plan tasks 1.1 (the skeleton), 1.4 (B0 set-up and the Atlas matter brief), 1.5 (step screens
B1 to B8), 1.6 and 1.11 (inventory and the automated-decision worklist), 1.9 (the worked example), 1.12 (the director
briefing) and 1.13 (governance goals). Still to come: the B9 screen, the checks (1.7), outputs (1.8) and the user guide (1.10).

- `public/` – the app
  - `/` – the engagement (`index.html`, `bd.js`, `bd-content.js`, `app.css`) and the worked example (`bd-example.js`: a fictional company, browser only, never saved)
  - `/shared/rules.js` – the roles and per-change permission rules, one copy read by the browser and the server
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
