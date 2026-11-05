// Email notifications: who should hear about what. Cloud-neutral. Same design as the other Triodian apps.
// Messages are always written to the notifications table. They are only emailed when a sender is
// configured (see src/worker.js); until then they are held, and administrators can see them in Admin.
// Emails carry question references and step names only: no inventory detail and no positions.

const short = (s, n = 160) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const dLong = ymd => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd || ''); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)).toLocaleDateString('en-AU', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }) : ymd; };
const TRI = ['methodOwner', 'recorder'];
const QUESTION_DAYS = 5;

function footer(origin) {
  return `\n\nOpen the engagement: ${origin}/\n\nYou get these emails because you take part in an AI Board Direction engagement. You can turn them off in your profile: ${origin}/profile/`;
}

/** Messages caused by one save. users: all users (with roles, active, notify). actor: the user who saved. */
export function eventsFromSave(oldData, newData, users, actor, origin) {
  if (!oldData || !newData) return [];
  const msgs = [], active = users.filter(u => u.active && u.id !== actor.id);
  const withRole = r => active.filter(u => (u.roles || []).includes(r));
  const who = actor.name || actor.email;
  const ref = (newData.engagement && (newData.engagement.reference || newData.engagement.company)) || 'the engagement';
  const send = (list, subject, text) => [...new Map(list.filter(Boolean).map(u => [u.id, u])).values()].forEach(u => msgs.push({ to: u, subject, text: text + footer(origin) }));

  // Questions to counsel: new → the GC; answered → Triodian
  const oldQ = new Map((oldData.questions || []).map(q => [q.ref, q]));
  (newData.questions || []).forEach(q => {
    const was = oldQ.get(q.ref);
    if (!was) send(withRole('gc'), `Question to counsel ${q.ref} · ${ref}`, `${who} raised a question to counsel${q.step ? ' at ' + q.step : ''}:\n\n"${short(q.question, 600)}"`);
    else if (q.status === 'answered' && was.status !== 'answered') send(TRI.flatMap(withRole), `Counsel answered ${q.ref} · ${ref}`, `${who} recorded counsel's answer to ${q.ref}.`);
  });
  // Scope agreed by one side → the other
  const sa = d => d.scopeAgreed || {};
  if (sa(newData).gcBy && !sa(oldData).gcBy && !sa(newData).chairBy) send(withRole('chair'), `Scope to agree · ${ref}`, `${who} recorded the GC's agreement to the scope (B0). The chair's agreement is next.`);
  // Resolution recorded → everyone with a role
  if ((newData.resolution || {}).by && !(oldData.resolution || {}).by) send(active.filter(u => (u.roles || []).length), `Resolved by the board · ${ref}`, `${who} recorded the board's resolution (B9).`);
  return msgs;
}

/** Daily: questions to counsel open for five days or more → the GC, one email per day. */
export function dueReminders(data, users, today, origin) {
  if (!data) return [];
  const t = Date.parse(today);
  const open = (data.questions || []).filter(q => q.status !== 'answered' && q.sentOn && (t - Date.parse(q.sentOn)) / 864e5 >= QUESTION_DAYS);
  if (!open.length) return [];
  const ref = (data.engagement && (data.engagement.reference || data.engagement.company)) || 'the engagement';
  const lines = open.map(q => `- ${q.ref}: raised ${dLong(q.sentOn)} · ${short(q.question, 120)}`).join('\n');
  return users.filter(u => u.active && (u.roles || []).includes('gc')).map(u => ({ to: u, subject: `Questions waiting for counsel · ${ref}`, text: `These questions to counsel have been open for ${QUESTION_DAYS} days or more:\n\n${lines}` + footer(origin), key: `due:${u.id}:${today}` }));
}
/** Writes messages to the outbox and sends them if a sender is configured. Never throws. */
export async function deliver(msgs, store, sender, now) {
  for (const m of msgs) {
    try {
      if (m.to.notify === false) continue;
      if (m.key && await store.hasNotification(m.key)) continue;
      const id = await store.addNotification({ key: m.key || null, to: m.to.email, subject: m.subject, body: m.text, status: sender ? 'sending' : 'held' }, now);
      if (!sender) continue;
      try { await sender({ to: m.to.email, subject: m.subject, text: m.text }); await store.markNotification(id, 'sent', '', now); }
      catch (e) { await store.markNotification(id, 'failed', String(e && (e.code || e.message) || e).slice(0, 200), now); }
    } catch (e) { /* a notification problem must never stop a save */ }
  }
}

export { TRI };
