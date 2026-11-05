# AI Board Direction (Triodian)

Single-engagement web app: each deployment holds one board engagement for one company. It takes a board through the
ten steps of the Board AI Appetite Framework, B0 to B9, facilitated by the board advisor and the general counsel, with
Triodian recording. It runs as a Cloudflare Worker: the files in `public/` are served as static assets, and
`src/worker.js` handles `/api/*`. The server design is the AI Confidentiality Exposure Assessment app's
(`Triodian/confidentiality-exposure-assessment`), which shares the AI Use Assessment's.

**Status:** development plan task 1.1 (the skeleton). Sign-in, admin, profile, set-up, the shared roles and the
server-side save check are in place. The step screens, checks and outputs come in tasks 1.4 to 1.13.

- `public/` – the app
  - `/` – the engagement (`index.html`, `bd.js`, `bd-content.js`, `app.css`)
  - `/shared/rules.js` – the roles and per-change permission rules, one copy read by the browser and the server
  - `/admin/` – users, their roles, access requests and activity (administrators only), from `account.js`
  - `/profile/` – your name, organisation, email address and preferences, from `account.js`
  - `/user-guide/` – the user guide
- `src/worker.js` – Cloudflare entry point
- `lib/core/` – cloud-neutral API (`api.js`), the server-side save check (`rbac.js`), versions, the next review
  (`review.js`), notifications, three-way merge
- `lib/identity/cloudflare-access.js` – verifies the Cloudflare Access sign-in
- `lib/store/d1.js` – database access (Cloudflare D1)
- `lib/config.js` – Access team domain and AUD tag, first administrator
- `wrangler.jsonc` – Worker configuration: `board-direction.triodian.com` (database `board-direction-db`) and the test
  site `board-direction-test.triodian.com` (database `board-direction-test-db`)
- `public/bd-content.json` – steps, modes, entity types and starting areas. Change wording there, then run
  `node tools/build-content.mjs` to rebuild `bd-content.js`

## The engagement document (schema `triodian.bd.v1`)
`engagement` (company, entity type, jurisdiction, mode, reference, privilege marking, practitioner, board dates),
`areas`, `scopeAgreed` (B0), `inventory` (B1), `positions` (B2 to B8), `questions` (to counsel), `resolution` (B9),
`versions`, `previous`, `history`. See the comment at the top of `public/shared/rules.js`.

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

There is no demo sign-in and no demo administrator on this app (development plan, task 0.2).

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
