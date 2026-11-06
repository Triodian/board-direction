// Email notifications: who should hear about what. Cloud-neutral. Same design as the other Triodian apps.
// Messages are always written to the notifications table. They are only emailed when a sender is
// configured (see src/worker.js); until then they are held, and administrators can see them in Admin.
// Emails carry question references and step names only: no inventory detail and no positions.

const short = (s, n = 160) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const dLong = ymd => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd || ''); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)).toLocaleDateString('en-AU', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }) : ymd; };
import { runChecks } from '../../public/shared/checks.js';
const TRI = ['methodOwner', 'recorder'];
const QUESTION_DAYS = 5;      // a question to counsel open this long reminds the GC each day
const WORKSHOP_DAYS = 3;      // in the days before the workshop: the briefing and the inventory, if not done
const RESOLUTION_DAYS = 7;    // in the week before the resolution meeting: the chair, with where things stand
const daysTo = (ymd, today) => Math.round((Date.parse(ymd) - Date.parse(today)) / 864e5);
const BOARD = ['chair', 'director'];
const briefed = (d, id) => !!(((d.education || {})[id] || {}).completedOn);
const INV_FIELDS = ['use', 'tool', 'area', 'who', 'authority', 'info', 'kind', 'owner', 'source'];
const incompleteLines = d => (d.inventory || []).filter(l => INV_FIELDS.some(k => !String(l[k] || '').trim()));

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
  // Scope agreed by one side → the other. Where the GC also acts as counsel, the second approver stands for the chair.
  const sa = d => d.scopeAgreed || {}, e = newData.engagement || {};
  const second = e.gcActsAsCounsel ? active.filter(u => u.id === e.secondApproverId) : withRole('chair');
  const secondName = e.gcActsAsCounsel ? 'second approver' : 'chair';
  if (sa(newData).gcBy && !sa(oldData).gcBy && !sa(newData).chairBy) send(second, `Scope to agree · ${ref}`, `${who} recorded the GC's agreement to the scope (B0). The ${secondName}'s agreement is next.`);
  if (sa(newData).chairBy && !sa(oldData).chairBy && !sa(newData).gcBy) send(withRole('gc'), `Scope to agree · ${ref}`, `${who} recorded the ${secondName}'s agreement to the scope (B0). The GC's agreement is next.`);
  // Scope agreed by both → the steps waiting: the CEO's inventory (B1) and each director's briefing (B0)
  if (sa(newData).gcBy && sa(newData).chairBy && !(sa(oldData).gcBy && sa(oldData).chairBy)) {
    // "waiting for you" includes whoever made this save: the step is news to them too
    const anyRole = r => users.filter(u => u.active && (u.roles || []).includes(r));
    if (!(newData.inventory || []).length || incompleteLines(newData).length) send(anyRole('ceo'), `The AI inventory is waiting for you · ${ref}`, `The scope is agreed. The AI inventory (B1) is next: one line for each AI use, 10 to 20 lines, with the people you nominate. Lines that make decisions about individuals raise a question to counsel automatically.`);
    send(BOARD.flatMap(anyRole).filter(u => !briefed(newData, u.id)), `Your director briefing · ${ref}`, `The scope is agreed. The director briefing (B0) is ready for you: about fifteen minutes, then four questions that check understanding. Only you and the facilitators see your answers.${(e.boardDates || {}).workshop ? ' Please complete it before the workshop on ' + dLong(e.boardDates.workshop) + '.' : ''}`);
  }
  // Resolution recorded → everyone with a role
  if ((newData.resolution || {}).by && !(oldData.resolution || {}).by) send(active.filter(u => (u.roles || []).length), `Resolved by the board · ${ref}`, `${who} recorded the board's resolution (B9).`);
  return msgs;
}

/**
 * Daily reminders, each sent at most once a day per person (the key):
 * - questions to counsel open five days or more → the GC;
 * - in the three days before the workshop: a director's briefing not completed → that director; the inventory empty
 *   or incomplete → the CEO;
 * - in the week before the resolution meeting, until the chair records it → the chair and Triodian, with how many
 *   checks pass, how many questions are open and how many directors have not completed the briefing. Counts and
 *   check names only: no positions or inventory detail.
 */
export function dueReminders(data, users, today, origin) {
  if (!data) return [];
  const out = [], e = data.engagement || {}, active = users.filter(u => u.active), withRole = r => active.filter(u => (u.roles || []).includes(r));
  const ref = e.reference || e.company || 'the engagement', resolved = !!(data.resolution || {}).by;
  const t = Date.parse(today);
  const open = (data.questions || []).filter(q => q.status !== 'answered' && q.sentOn && (t - Date.parse(q.sentOn)) / 864e5 >= QUESTION_DAYS);
  if (open.length) {
    const lines = open.map(q => `- ${q.ref}: raised ${dLong(q.sentOn)} · ${short(q.question, 120)}`).join('\n');
    withRole('gc').forEach(u => out.push({ to: u, subject: `Questions waiting for counsel · ${ref}`, text: `These questions to counsel have been open for ${QUESTION_DAYS} days or more:\n\n${lines}` + footer(origin), key: `due:${u.id}:${today}` }));
  }
  if (resolved) return out;
  const wd = (e.boardDates || {}).workshop, rd = (e.boardDates || {}).resolution;
  if (wd && daysTo(wd, today) >= 0 && daysTo(wd, today) <= WORKSHOP_DAYS) {
    const when = daysTo(wd, today) === 0 ? 'today' : `on ${dLong(wd)}`;
    BOARD.flatMap(withRole).filter((u, i, a) => a.findIndex(x => x.id === u.id) === i && !briefed(data, u.id)).forEach(u => out.push({ to: u, subject: `Your director briefing · ${ref}`, text: `The workshop is ${when}. Your director briefing (B0) is not yet complete: about fifteen minutes, then four questions that check understanding.` + footer(origin), key: `brief:${u.id}:${today}` }));
    const inv = data.inventory || [], inc = incompleteLines(data);
    if (!inv.length || inc.length) withRole('ceo').forEach(u => out.push({ to: u, subject: `The AI inventory before the workshop · ${ref}`, text: `The workshop is ${when}. ${!inv.length ? 'The AI inventory (B1) has no lines yet.' : `${inc.length} line${inc.length === 1 ? ' is' : 's are'} still to complete: ${inc.map(l => l.id).join(', ')}.`} The board tests each position against it.` + footer(origin), key: `inv:${u.id}:${today}` }));
  }
  if (rd && daysTo(rd, today) >= 0 && daysTo(rd, today) <= RESOLUTION_DAYS) {
    const checks = runChecks(data), pass = checks.filter(c => c.ok).length, openQ = (data.questions || []).filter(q => q.status !== 'answered').length;
    const notBriefed = BOARD.flatMap(withRole).filter((u, i, a) => a.findIndex(x => x.id === u.id) === i && !briefed(data, u.id)).length;
    const when = daysTo(rd, today) === 0 ? 'today' : `on ${dLong(rd)}`;
    const text = `The board's resolution (B9) is due ${when}. Where things stand:\n\n- Checks passing: ${pass} of ${checks.length}${pass < checks.length ? ' (' + checks.filter(c => !c.ok).map(c => c.id + ' ' + c.name).join(', ') + ')' : ''}\n- Questions to counsel open: ${openQ}\n- Directors yet to complete the briefing: ${notBriefed}\n\nThe checks never stop the board resolving; they show what is incomplete so the board decides knowingly.`;
    withRole('chair').forEach(u => out.push({ to: u, subject: `Resolution due · ${ref}`, text: text + footer(origin), key: `res:${u.id}:${today}` }));
    TRI.flatMap(withRole).forEach(u => out.push({ to: u, subject: `Resolution due · ${ref}`, text: text + footer(origin), key: `res:${u.id}:${today}` }));
  }
  return out;
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
