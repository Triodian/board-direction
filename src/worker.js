// Cloudflare Worker entry point for the AI Board Direction app.
// Static files in /public (the app, /admin and /profile) are served by Cloudflare. Requests to /api/* come here.
// All the app logic is in lib/core (cloud-neutral); this file only connects it to Cloudflare:
//   identity → lib/identity/session.js (the /login page and sessions; Cloudflare Access guards /auth/email only)
//   storage  → lib/store/d1.js (Cloudflare D1)
//   email    → Cloudflare Email Service binding EMAIL, only when NOTIFY_SENDING is "on"
import { whoIs, handleAuth, gate, markDemo } from '../lib/identity/session.js';
import { d1Store } from '../lib/store/d1.js';
import { identityUsers, withIdentity } from '../lib/identity/people.js';
import { handle, boardDirections } from '../lib/core/api.js';
import { dueReminders, deliver } from '../lib/core/notify.js';

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

/** Returns a function that emails one message, or null while sending is switched off. */
function emailSender(env) {
  if (env.NOTIFY_SENDING !== 'on' || !env.EMAIL || !env.NOTIFY_FROM) return null;
  return m => env.EMAIL.send({ to: m.to, from: { email: env.NOTIFY_FROM, name: 'AI Board Direction' }, subject: m.subject, text: m.text });
}
const siteUrl = (env, request) => env.SITE_URL || (request ? new URL(request.url).origin : 'https://board-direction.triodian.com');

/** The app's store. With the IDENTITY binding (the suite's shared identity database, plan task 1B.2) its users and their
 *  roles come from there, so a person is added once for the suite; everything else stays in this app's own database. */
const APP_ID = 'board-direction';
const storeFor = env => withIdentity(d1Store(env.DB), env.IDENTITY ? identityUsers(env.IDENTITY, APP_ID, env.DB) : null);

/** The recorded board directions for another Triodian app over a service binding (src/service.js; plan task 3.4).
 *  Read from this app's own database only: the directions are engagement data, not identity. */
export async function directionsForService(env) {
  if (!env.DB) return { status: 503, body: { error: 'The database is not connected to the Board Direction app yet.' } };
  try { return await boardDirections(d1Store(env.DB)); }
  catch (e) { console.error(e); return { status: 500, body: { error: 'The Board Direction app hit an error reading the board directions.' } }; }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Sign-in: /login (a static page), /auth/* (lib/identity/session.js). Pages need a session; assets do not.
    if (url.pathname.startsWith('/auth/')) return (await handleAuth(request, env)) || new Response('Not found', { status: 404 });
    if (!url.pathname.startsWith('/api/')) return (await gate(request, env)) || markDemo(await env.ASSETS.fetch(request), env);

    const who = await whoIs(request, env);
    if (!who.email) return json({ error: who.error }, who.status || 401);
    if (!env.DB) return json({ error: 'The database is not connected to this site yet.' }, 503);

    try {
      const r = await handle({
        method: request.method, path: url.pathname, email: who.email, text: () => request.text(),
        firstAdmins: String(env.FIRST_ADMINS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean),
        site: env.SITE_LABEL || '', defaults: { jurisdiction: String(env.DEFAULT_JURISDICTION || 'AU').toUpperCase(), sector: env.DEFAULT_SECTOR || '' }, origin: siteUrl(env, request), sender: emailSender(env), defer: p => ctx.waitUntil(p),
      }, storeFor(env));
      return json(r.body, r.status);
    } catch (e) {
      console.error(e);
      return json({ error: 'The server hit an error. Try again.' }, 500);
    }
  },

  // Daily: remind the GC about questions open for five days or more.
  async scheduled(event, env, ctx) {
    if (!env.DB) return;
    const store = storeFor(env);
    ctx.waitUntil((async () => {
      await store.init();
      const e = await store.getEngagement(); if (!e) return;
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: env.REMINDER_TZ || 'Australia/Brisbane' }).format(new Date());
      await deliver(dueReminders(e.data, await store.listUsers(), today, siteUrl(env)), store, emailSender(env), new Date().toISOString());
    })());
  },
};
