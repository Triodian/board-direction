/* The outputs of AI Board Direction (Board AI Appetite Framework, section 8; development plan task 1.8).
   Each builder takes the engagement and returns Markdown, which public/export.js turns into a Word document; the
   confidentiality position file is JSON. Plain JavaScript with no page code, so the same builders run in the browser
   and in the unit tests (tests/outputs.test.mjs), which generate every output from the worked example.

   Language rules (framework 8.8), followed by every builder:
   - state what was recorded and who proposed it; never what the law requires, whether a duty is met, or what the
     board should decide;
   - name no product;
   - no member, customer or client personal information, and no confidential content: uses and information are described by
     kind (the engagement itself records the people in it, by name and role);
   - "red line", "reserved" and "not tolerated" only for positions the board recorded.
   Every output carries the privilege marking on its first line and its status (draft until the chair records the
   resolution at B9) in the footer of every page. */
(function (root) {
  const POSTURE_MAX = { S1: 1, S2: 2, S3: 4, S4: 6 };
  const CLASSES = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'], KINDS = ['K1', 'K2', 'K3', 'K4', 'K5', 'K7'];
  const MARK = { P: 'Permitted', C: 'With conditions', N: 'Not permitted' };

  function make(S, C, opts) {
    opts = opts || {};
    const SC = C.scales, e = S.engagement || {}, P = S.positions || {}, pos = k => P[k] || {};
    const today = opts.today || new Date().toISOString().slice(0, 10);
    const lbl = (list, v) => { const r = (list || []).find(x => x[0] === v); return r ? r[1] : (v || ''); };
    const dl = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? new Date(v + 'T12:00:00Z').toLocaleDateString('en-AU', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }) : (v || '');
    const cell = v => String(v == null ? '' : v).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
    const areaName = id => ((S.areas || []).find(a => a.id === id) || {}).name || id || '';
    const pname = id => ((S.people || []).find(p => p.id === id) || {}).name || id || '';
    const resolved = !!(S.resolution && S.resolution.by), r = S.resolution || {};
    const connected = e.mode === 'connected';
    const company = e.company || '[company]';
    // framework 9.2: "Resolved by the board, version [n], [date], minute [ref]"
    const rv = [...(S.versions || [])].reverse().find(v => /Resolved/.test(v.label || ''));
    const status = resolved ? `Resolved by the board${rv ? ', version ' + rv.id : ''}, ${dl(r.on)}${r.minuteRef ? ', ' + r.minuteRef : ''}` : 'Draft, not resolved by the board';
    const lc = t => String(t || '').replace(/\.$/, '').replace(/^([A-Z])(?=[a-z])/, c => c.toLowerCase());
    const tableMd = (head, rows) => rows.length ? ['| ' + head.map(cell).join(' | ') + ' |', '| ' + head.map(() => '---').join(' | ') + ' |', ...rows.map(x => '| ' + x.map(cell).join(' | ') + ' |')].join('\n') : '';

    /* The opening every output shares: marking, title, company line, status, preparer, and the GC note. */
    function head(title, lead, id) {
      const out = [];
      if (String(e.privilegeMarking || '').trim()) out.push(e.privilegeMarking.trim(), '');
      out.push(`# ${title}`, '', `**${cell(company)}**${e.reference ? ' · ' + cell(e.reference) : ''} · ${status}`, '');
      // the practitioner's name and line are in the page header of every page, so they are not repeated here
      if (e.gcActsAsCounsel) out.push('The general counsel also acted as counsel in this engagement.', '');
      if (lead) out.push(lead, '');
      const tags = id && root.BDEvidence ? root.BDEvidence.tagLine('BD', id) : ''; // task R.2
      if (tags) out.push(`Evidence for: ${tags}.`, '');
      return out;
    }

    /* The reality note (framework 10.1): inventory lines that already cross a recorded position. */
    function reality() {
      const out = [], b2 = pos('B2'), cells = pos('B5').cells || {}, lines = pos('B3').lines || [];
      (S.inventory || []).forEach(l => {
        const p = (b2[l.area] || {}).posture, n = +String(l.authority || '').slice(1);
        if (p && POSTURE_MAX[p] && n > POSTURE_MAX[p]) out.push({ line: l, kind: 'posture', why: `${l.authority} ${lbl(SC.authority, l.authority)} is above what ${lbl(SC.posture, p)} accepts in ${areaName(l.area)}`, action: `Bring ${l.id} to the board for approval, or bring it within the ${lbl(SC.posture, p)} posture for ${areaName(l.area)}.` });
        if (cells[l.info + ':' + l.kind] === 'N') out.push({ line: l, kind: 'marking', why: `${l.info} ${lbl(SC.infoClass, l.info)} through ${lbl(SC.toolKind, l.kind)} is marked not permitted`, action: `Stop ${lc(lbl(SC.infoClass, l.info))} information going into ${lc(lbl(SC.toolKind, l.kind))} through ${l.id}, or change how the use is set up.` });
        lines.filter(x => x.testedAgainst === l.id).forEach(x => out.push({ line: l, kind: 'redline', why: `crosses red line ${x.id}`, action: `Stop ${l.id}, or bring an exception to red line ${x.id} to the board.` }));
      });
      return out;
    }

    const goals = () => pos('B2').goals || [];
    const postureRows = () => (S.areas || []).map(a => { const x = pos('B2')[a.id] || {}; return [a.name, x.posture === 'NS' ? `Not set: ${x.notSetOwner || '[who]'} to set it by ${x.notSetBy || '[when]'}` : x.posture ? lbl(SC.posture, x.posture) : 'Not set', x.condition || '']; });
    const harmName = h => lbl(SC.harm, h);

    /* ---------- BO1: AI risk appetite statement (standalone) ---------- */
    function statement() {
      const out = head('AI risk appetite statement', 'Settled by the general counsel.', 'statement');
      const b2 = pos('B2'), lines = pos('B3').lines || [], rv = pos('B4').events || [], b5 = pos('B5'), harms = pos('B6').harms || {}, b7 = pos('B7'), owners = pos('B8').owners || {};
      out.push('## 1. Purpose and scope', '', `This statement sets out the board’s position on artificial intelligence used by ${company}, by its providers for it, and by its people on its behalf. It sits beside the company’s risk appetite or risk register.`, '');
      if (goals().length) { out.push('The board wants its governance of AI to achieve the following.', ''); goals().forEach(g => out.push(`- **${cell(g.goal)}** Owner: ${cell(g.owner || 'not named')}. Measured by: ${cell(g.measure || 'not set')}.`)); out.push(''); }
      // the overall position, drafted from what was recorded, for the board to put in its own words
      const want = (S.areas || []).filter(a => ['S3', 'S4'].includes((b2[a.id] || {}).posture)).map(a => lc(a.name));
      const decides = want;
      const before = rv.filter(x => /before/i.test(x.timing || '')).map(x => lc(x.event));
      out.push('## 2. Overall position', '', `[For the board to put in its own words. Drafted from the positions recorded:] ${company} wants AI used in ${want.length ? want.join(', ') : '[areas]'}. It accepts AI that decides only in ${decides.length ? decides.join(', ') : '[where]'}, does not accept ${lines.length ? lines.map(l => lc(l.use)).join('; ') : '[red lines]'}, and expects to approve ${before.length ? before.join('; ') : '[reserved decisions]'} itself.`, '');
      out.push('## 3. Posture by area', '', tableMd(['Area', 'Posture', 'Condition'], postureRows()), '', SC.posture.map(p => `**${p[1]}**: ${p[2]}`).join(' '), '');
      out.push('## 4. Red lines', '');
      if (lines.length) { lines.forEach(l => out.push(`- ${cell(l.use)} (${cell(l.scope || 'All areas')}; applies to ${cell((l.appliesTo || 'the company').replace(/^The /, 'the '))})`)); out.push(''); }
      else out.push('The board set no red lines.', '');
      out.push('## 5. Decisions reserved to the board', '');
      if (rv.length) out.push(tableMd(['Event', 'The board', 'Brought by'], rv.map(x => [x.event, x.timing || 'Not set', x.by || 'Not named'])), '');
      else out.push('No reserved decisions were recorded. The six starting events apply, with the board told after: a new AI use at a high authority level; a new use in an area marked Avoid; an exception to a red line; a new provider whose AI sees restricted or board information; a material AI incident; a change to this statement or its measures.', '');
      { const fp = pos('B4').fastPath || {}; if (fp.days) out.push(`**Fast path.** ${cell(fp.by || 'Management')} may approve a new AI use that assists or recommends (A1 or A2) and reaches no threshold in section 7 within ${cell(fp.days)} days, and reports it to the board under the measures in section 8.`, ''); }
      out.push('## 6. Confidential information', '', 'What information may go into which kinds of AI tool.', '');
      const cells = b5.cells || {};
      out.push(tableMd(['Information', ...KINDS.map(k => lbl(SC.toolKind, k))], CLASSES.map(g => [lbl(SC.infoClass, g), ...KINDS.map(k => MARK[cells[g + ':' + k]] || 'Not set')])), '');
      if ((b5.conditions || []).filter(Boolean).length) { out.push('Conditions:', ''); b5.conditions.filter(Boolean).forEach(c => out.push('- ' + cell(c))); out.push(''); }
      out.push('## 7. Harm not tolerated', '');
      const hrows = SC.harm.map(h => { const v = harms[h[0]] || {}; return [h[1], v.statement || 'Existing thresholds apply', v.threshold || '']; });
      out.push(tableMd(['Harm to', 'Not tolerated', 'Threshold'], hrows), '', 'A material AI incident is an AI failure that reaches any threshold above.', '');
      out.push('## 8. Reporting', '');
      if ((b7.measures || []).length) out.push('At each meeting:', '', tableMd(['Measure', 'Limit', 'Owner'], b7.measures.map(m => [m.measure, m.limit || '', m.owner || 'Not named'])), '');
      if ((b7.events || []).length) out.push('Between meetings:', '', tableMd(['Event', 'Reported to', 'Within'], b7.events.map(x => [x.event, x.to || '', x.within || ''])), '');
      if (!(b7.measures || []).length && !(b7.events || []).length) out.push('No reporting was recorded.', '');
      out.push('## 9. Accountability', '', tableMd(['', 'Named'], SC.accountability.map(a => [a[1], owners[a[0]] || 'Not named'])), '');
      out.push('## 10. Review', '', `${r.interval || 'At least annually, in the same cycle as the board’s other risk reviews'}. The positions are revisited when any of these occurs:`, '');
      const ce = (C.resolution || {}).changeEvents || [];
      ce.filter(x => !r.changeEvents || r.changeEvents.includes(x[0])).forEach(x => out.push(`- ${x[1]}: ${x[2]}.`));
      return out.join('\n');
    }

    /* ---------- BO6: board directions paper (connected) ---------- */
    function directions() {
      const out = head('Board directions on AI', 'The board’s directions BD1 to BD7, each read on the decision of the AI risk appetite engagement shown. Positions there that go past a direction cannot form part of the working appetite until a reason is recorded and the board revisits the direction.', 'directions');
      const lines = pos('B3').lines || [], rv = pos('B4').events || [], cells = pos('B5').cells || {}, harms = pos('B6').harms || {}, b7 = pos('B7'), owners = pos('B8').owners || {};
      out.push('## BD1 Posture by area · read on decision 1, authority', '', tableMd(['Area', 'Posture', 'Condition'], postureRows()), '');
      if (goals().length) { out.push('Governance goals, for the board paper and board view (not read by the risk appetite engagement):', ''); goals().forEach(g => out.push(`- ${cell(g.goal)} (owner ${cell(g.owner || 'not named')}; measure ${cell(g.measure || 'not set')})`)); out.push(''); }
      out.push('## BD2 Red lines · read on decisions 1, authority, and 6, location', '');
      lines.length ? (lines.forEach(l => out.push(`- ${cell(l.use)} (${cell(l.scope || 'All areas')}; ${cell(l.appliesTo || '')})`)), out.push('')) : out.push('No red lines were set.', '');
      out.push('## BD3 Reserved decisions · read on decisions 1, authority, and 4, shortfall tolerance', '', rv.length ? tableMd(['Event', 'The board', 'Brought by'], rv.map(x => [x.event, x.timing || '', x.by || ''])) : 'The six starting events apply, with the board told after.', '');
      { const fp = pos('B4').fastPath || {}; if (fp.days) out.push(`Fast path (FP): ${cell(fp.by || 'Management')} approves a new use at A1 or A2 that reaches no BD5 threshold within ${cell(fp.days)} days.`, ''); }
      out.push('## BD4 Confidential information · recorded on each AI use assessment entry that reaches the class', '', tableMd(['Information', ...KINDS], CLASSES.map(g => [lbl(SC.infoClass, g), ...KINDS.map(k => cells[g + ':' + k] || '—')])), '');
      out.push('## BD5 Harm not tolerated · read on decision 2, consequence thresholds', '', tableMd(['Harm to', 'Not tolerated', 'Threshold'], SC.harm.map(h => { const v = harms[h[0]] || {}; return [h[1], v.statement || 'Existing thresholds', v.threshold || '']; })), '');
      out.push('## BD6 Reporting expected · read on decision 7, triggers, and the measures', '', tableMd(['Measure or event', 'Limit or time', 'Owner or recipient'], [...(b7.measures || []).map(m => [m.measure, m.limit || '', m.owner || '']), ...(b7.events || []).map(x => [x.event, x.within || '', x.to || ''])]), '');
      out.push('## BD7 Accountability · the owners of every position', '', tableMd(['', 'Named'], SC.accountability.map(a => [a[1], owners[a[0]] || 'Not named'])));
      return out.join('\n');
    }

    /* ---------- BO2: acceptable-use policy outline ---------- */
    function aupOutline() {
      const out = head('Acceptable-use policy outline', 'The headings a staff policy needs to give effect to the board’s positions, each filled with the positions it draws on. The general counsel drafts the policy from it. This outline is not a policy.', 'aupOutline');
      const cells = pos('B5').cells || {}, conds = (pos('B5').conditions || []).filter(Boolean), lines = pos('B3').lines || [], rv = pos('B4').events || [], b7 = pos('B7'), owners = pos('B8').owners || {};
      out.push('## 1. Permitted tools', '', 'From the confidential-information positions (B5): the kinds of AI tool the board permits for at least some information.', '');
      KINDS.forEach(k => { const ok = CLASSES.filter(g => cells[g + ':' + k] && cells[g + ':' + k] !== 'N'); out.push(`- **${lbl(SC.toolKind, k)}**: ${ok.length ? 'permitted for ' + ok.map(g => lc(lbl(SC.infoClass, g)) + (cells[g + ':' + k] === 'C' ? ' (with conditions)' : '')).join(', ') : 'not permitted for any information'}.`); });
      out.push('', '## 2. Information rules', '');
      CLASSES.forEach(g => { const by = m => KINDS.filter(k => cells[g + ':' + k] === m).map(k => lc(lbl(SC.toolKind, k))); const p = by('P'), c = by('C'), n = by('N'); out.push(`- **${lbl(SC.infoClass, g)}**: ${[p.length && 'may go into ' + p.join(', '), c.length && 'with conditions into ' + c.join(', '), n.length && 'not into ' + n.join(', ')].filter(Boolean).join('; ') || 'not set'}.`); });
      if (conds.length) { out.push('', 'Conditions:', ''); conds.forEach(c => out.push('- ' + cell(c))); }
      out.push('', '## 3. Uses not permitted', '');
      lines.length ? lines.forEach(l => out.push(`- ${cell(l.use)} (${cell(l.scope || 'All areas')})`)) : out.push('The board set no red lines.');
      out.push('', '## 4. Uses needing approval', '');
      const bef = rv.filter(x => /before/i.test(x.timing || ''));
      bef.length ? bef.forEach(x => out.push(`- ${cell(x.event)}: brought to the board by ${cell(x.by || 'the accountable executive')}, ${cell(x.timing).toLowerCase()}.`)) : out.push('No use was recorded as needing the board’s approval before it starts.');
      const after = rv.filter(x => !/before/i.test(x.timing || '') && x.event);
      if (after.length) { out.push('', 'Reported to the board after the event:', ''); after.forEach(x => out.push(`- ${cell(x.event)}${x.timing ? ' (' + cell(x.timing).toLowerCase() + ')' : ''}`)); }
      const adm = (S.inventory || []).filter(l => l.adm);
      out.push('', '## 5. Decisions about individuals', '', adm.length ? `${adm.length} use${adm.length === 1 ? ' is' : 's are'} recorded as making, or substantially contributing to, decisions about individuals using their personal information: ${adm.map(l => `${l.id} (${cell(l.use)})`).join('; ')}. Each is on the automated-decision worklist for counsel. What the policy says about them is for counsel.` : 'No use is recorded as making decisions about individuals.');
      out.push('', '## 6. Reporting a problem', '');
      (b7.events || []).length ? b7.events.forEach(x => out.push(`- ${cell(x.event)}: report to ${cell(x.to || '[whom]')} within ${cell(x.within || '[time]')}.`)) : out.push('No events were recorded for reporting between meetings.');
      // How a person raises a concern about AI, and how the board hears of it (ISO/IEC 42001:2023, A.3.3; task ISO.7).
      const concern = (b7.measures || []).find(m => /concern/i.test(m.measure || ''));
      out.push('', '## 7. Raising a concern', '', 'How a member of staff, a customer or a provider raises a concern about the company’s use of AI: to whom, by what route, and that it can be raised without detriment to the person who raises it (ISO/IEC 42001:2023, A.3.3 Reporting of concerns). The route may be the company’s existing speak-up or complaints process, named here.', '',
        concern ? `The board hears of concerns through measure ${concern.id}: ${cell(concern.measure)}${concern.limit ? ' (limit: ' + cell(concern.limit) + ')' : ''}.` : 'No measure for concerns raised is recorded at B7. Without one the board does not hear of them.');
      out.push('', '## 8. Owners', '');
      SC.accountability.forEach(a => out.push(`- ${a[1]}: ${cell(owners[a[0]] || 'not named')}`));
      return out.join('\n');
    }

    /* ---------- BO3: board minute ---------- */
    function minute() {
      const out = head('Board minute: AI risk appetite', '', 'minute');
      const docName = connected ? 'the board directions paper' : 'the AI risk appetite statement';
      out.push(`**Meeting:** ${r.meetingOn ? dl(r.meetingOn) : (e.boardDates || {}).resolution ? dl(e.boardDates.resolution) : '[date]'} · **Minute:** ${r.minuteRef || '[reference]'}`, '');
      out.push('## Resolution', '', resolved ? cell(r.text) : '[The resolution has not been recorded. The chair records it at the meeting.]', '');
      if (r.amendments) out.push(`**Amendments made at the meeting:** ${cell(r.amendments)}`, '');
      out.push(`The positions resolved are those recorded in steps B2 to B8 and set out in ${docName}.`, '');
      const dis = [];
      (S.areas || []).forEach(a => { const x = pos('B2')[a.id] || {}; if (x.dissent) dis.push([`Posture, ${a.name}`, x.dissent]); });
      (pos('B3').lines || []).forEach(x => { if (x.dissent) dis.push([`Red line ${x.id}`, x.dissent]); });
      (pos('B4').events || []).forEach(x => { if (x.dissent) dis.push([`Reserved decision ${x.id}`, x.dissent]); });
      Object.entries(pos('B6').harms || {}).forEach(([h, v]) => { if (v && v.dissent) dis.push([`Harm, ${harmName(h)}`, v.dissent]); });
      ['B5', 'B7', 'B8'].forEach(k => { if (pos(k).dissent) dis.push([C.steps.find(s => s.id === k).name, pos(k).dissent]); });
      out.push('## Dissent recorded', '', dis.length ? tableMd(['Position', 'Dissent'], dis) : 'None recorded.', '');
      const people = (S.people || []).filter(p => (p.roles || []).some(x => x === 'chair' || x === 'director'));
      const notDone = people.filter(p => !((S.education || {})[p.id] || {}).completedOn);
      out.push('## Director briefing', '', notDone.length ? `Not completed before the resolution: ${notDone.map(p => p.name).join(', ')}.${r.proceedNote ? ' ' + cell(r.proceedNote) : ''}` : 'Every director completed the briefing.', '');
      const open = (S.questions || []).filter(q => q.status !== 'answered');
      out.push('## Questions to counsel still open', '', open.length ? tableMd(['Ref', 'Question'], open.map(q => [q.ref, q.question])) : 'None.', '');
      out.push('## Review', '', `${r.interval || '[interval]'}, and on any change event recorded in ${docName}.`);
      return out.join('\n');
    }

    /* ---------- BO4: 90-day action list ---------- */
    function actionList() {
      const start = resolved ? r.on : today, due = new Date(start + 'T12:00:00Z'); due.setUTCDate(due.getUTCDate() + 90);
      const dueOn = dl(due.toISOString().slice(0, 10));
      const out = head('90-day action list', `Every gap between the AI inventory (B1) and the board’s positions, as an action with an owner and a date. For the CEO. Counted at each meeting${pos('B7').measures && pos('B7').measures.some(m => m.id === 'BM5') ? ' in BM5' : ''}.`, 'actionList');
      const rows = [];
      reality().forEach(x => rows.push([x.line.id, x.line.use, x.why.replace(/^\w/, c => c.toUpperCase()), x.action, pname(x.line.owner) || 'CEO', dueOn]));
      (S.areas || []).forEach(a => { const x = pos('B2')[a.id] || {}; if (x.posture === 'NS') rows.push(['B2', a.name, 'Posture not set', `Set the posture for ${a.name}.`, x.notSetOwner || 'Chair', x.notSetBy || dueOn]); });
      const owners = pos('B8').owners || {};
      SC.accountability.filter(a => a[0] !== 'AC2' && !String(owners[a[0]] || '').trim()).forEach(a => rows.push(['B8', a[1], 'Not named', `Name the ${lc(a[1])}.`, 'Chair', dueOn]));
      (pos('B7').measures || []).filter(m => !String(m.owner || '').trim()).forEach(m => rows.push([m.id, m.measure, 'No owner', `Name an owner for ${m.id}.`, 'CEO', dueOn]));
      out.push(rows.length ? tableMd(['Ref', 'Use or position', 'Gap', 'Action', 'Owner', 'By'], rows) : 'No gaps between the inventory and the board’s positions were found.', '');
      out.push(`Dates are 90 days from ${resolved ? 'the resolution' : 'today; they move to 90 days from the resolution once it is recorded'}.`);
      return out.join('\n');
    }

    /* ---------- the engagement plan (framework 7.2 and 7.3), with where each step stands ---------- */
    function plan() {
      const out = head('Engagement plan', connected ? 'Connected mode: the board gives directions before the AI risk appetite engagement and approves its statement after.' : 'Standalone mode: two to four weeks, one workshop of about three hours, resolved at the next board meeting.', 'plan');
      const role = rs => (S.people || []).filter(p => (p.roles || []).some(x => rs.includes(x))).map(p => p.name).join(', ');
      const sa = S.scopeAgreed || {}, inv = S.inventory || [], dirs = (S.people || []).filter(p => (p.roles || []).some(x => x === 'chair' || x === 'director'));
      const briefed = dirs.filter(p => ((S.education || {})[p.id] || {}).completedOn).length;
      const recorded = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'].filter(k => Object.keys(pos(k)).length).length;
      const wd = (e.boardDates || {}).workshop, rd = (e.boardDates || {}).resolution;
      const rows = [
        ['1. Set up', 'Week 1', 'The GC confirms scope and privilege. Mode, areas and dates set. The matter brief loaded.', [role(['gc']), 'Triodian'].filter(Boolean).join('; '), sa.gcBy && sa.chairBy ? 'Scope agreed' : e.matterBrief ? 'Brief loaded; scope not yet agreed' : 'Not started'],
        ['2. Inventory', 'Week 1', 'The CEO and nominated staff complete B1. Each line has a source.', role(['ceo']) || 'CEO', inv.length ? `${inv.length} line${inv.length === 1 ? '' : 's'}` : 'Not started'],
        ['3. Pre-read', 'Week 1, end', 'Each director takes the briefing.', [role(['advisor']), 'Triodian'].filter(Boolean).join('; '), dirs.length ? `${briefed} of ${dirs.length} directors complete` : 'No directors named'],
        ['4. Workshop', wd ? dl(wd) : 'Week 2', 'B2 to B8 in order. Each position recorded with who proposed it. Legal questions logged.', [role(['chair']), role(['advisor'])].filter(Boolean).join('; '), `${recorded} of 7 steps recorded`],
        ['5. Checks and drafting', 'Weeks 2 to 3', 'The checks BK1 to BK7 run; failures go back to the CEO and the chair. The GC answers questions and settles wording.', [role(['gc']), 'Triodian'].filter(Boolean).join('; '), `${(S.questions || []).filter(q => q.status !== 'answered').length} questions to counsel open`],
        [connected ? '6. Approve' : '6. Resolve', rd ? dl(rd) : 'Next board meeting', connected ? 'The board approves the AI risk appetite statement and confirms or changes the directions (B9).' : 'The board resolves, amends or returns the statement (B9).', role(['chair']) || 'Chair', resolved ? `Resolved ${dl(r.on)}` : 'Not yet'],
      ];
      out.push(tableMd(['Step', 'When', 'Activity', 'Who', 'Where it stands'], rows));
      return out.join('\n');
    }

    /* ---------- the confidentiality position file (framework 9.3), JSON ---------- */
    function confidentiality() {
      const b5 = pos('B5'), cells = {};
      CLASSES.forEach(g => KINDS.forEach(k => { if (b5.cells && b5.cells[g + ':' + k]) cells[g + ':' + k] = b5.cells[g + ':' + k]; }));
      return {
        format: 'triodian.bd.confidentiality.v1',
        engagementId: e.id || '',
        status: resolved ? 'resolved' : 'draft',
        resolvedOn: resolved ? r.on : null,
        issuedOn: today,
        classes: CLASSES, kinds: KINDS,
        markings: cells,
        conditions: (b5.conditions || []).filter(Boolean),
        note: 'The board’s position on which classes of information may go into which kinds of AI tool: P permitted, C with conditions, N not permitted. A confidential-matter assessment imports it and shows a suggested required rung on each channel; counsel confirms or replaces it. It carries no inventory lines and no names.',
      };
    }

    /* ---------- the framework crosswalk (development plan task 7.6) ----------
       For the technology owner and the AI governance team: where what the board recorded supplies the direction from
       the top that the frameworks they already run ask for. ISO/IEC 42001:2023 and the NIST AI RMF 1.0 first. It
       states what is recorded against each reference and nothing more: it is not a statement of conformity with
       either framework, and it is not legal advice. The NIST entries are paraphrases, not the framework's text. */
    function crosswalk() {
      const out = head('Framework crosswalk', 'Where the board’s direction supplies the direction from the top that an AI management framework asks for. For the technology owner and the AI governance team, to place beside the framework they already run.', 'crosswalk');
      const inv = S.inventory || [], b2 = pos('B2'), areas = S.areas || [], set = areas.filter(a => (b2[a.id] || {}).posture && b2[a.id].posture !== 'NS').length;
      const dirs = (S.people || []).filter(p => (p.roles || []).some(x => x === 'chair' || x === 'director')), briefed = dirs.filter(p => ((S.education || {})[p.id] || {}).completedOn).length;
      const n = (k, one, many) => `${k} ${k === 1 ? one : many}`, none = 'Not yet recorded';
      const lines = (pos('B3').lines || []).length, reserved = (pos('B4').events || []).length, marked = Object.keys(pos('B5').cells || {}).length, harms = Object.keys(pos('B6').harms || {}).length;
      const ms = (pos('B7').measures || []).length, evs = (pos('B7').events || []).length, owners = Object.values(pos('B8').owners || {}).filter(v => String(v || '').trim()).length, goals = (b2.goals || []).length;
      const mb = S.managementBriefing || {};
      const rows = [
        ['B0 Briefings', dirs.length ? `${briefed} of ${n(dirs.length, 'director', 'directors')} completed the director briefing` + (mb.heldOn ? `; management briefing held ${dl(mb.heldOn)}` : '') : none, 'The people who decide start from the same understanding of AI', '7.2 Competence; 7.3 Awareness', 'GOVERN 2.2 (training for those with AI risk duties)', 'Evaluate: the governing body’s own understanding of AI and of how the organisation uses it'],
        ['B1 Inventory', inv.length ? `${n(inv.length, 'line', 'lines')}${inv.some(l => l.confirmedBy) ? `, ${inv.filter(l => l.confirmedBy).length} confirmed by the technology owner` : ''}` : none, 'The list of AI in use that every position is tested against', 'No single clause; it informs 4.3 Scope of the AI management system', 'GOVERN 1.6 (a way to inventory AI systems)', 'Evaluate: the current use of AI, before direction is given'],
        ['B2 Posture and goals', set || goals ? `A posture for ${set} of ${n(areas.length, 'area', 'areas')}; ${n(goals, 'governance goal', 'governance goals')}` : none, 'How far AI may go in each area, and what governance of AI is to achieve', '5.1 Leadership and commitment; 6.2 AI objectives', 'GOVERN 1.3 (effort set by risk tolerance); MAP 1.5 (risk tolerances determined and documented)', 'Direct: the objectives for the use of AI and how much risk is accepted in pursuing them'],
        ['B3 Red lines', lines ? n(lines, 'red line', 'red lines') : none, 'The uses the board will not accept, each tested against the inventory', '5.2 AI policy; A.2.2 AI policy; A.9.2 Processes for responsible use of AI systems', 'GOVERN 1.4 (risk management set out in policies and controls)', 'Direct: policy on the use of AI'],
        ['B4 Reserved decisions', reserved ? n(reserved, 'reserved event', 'reserved events') : none, 'What comes to the board before it happens, and what the board is told after', '5.3 Roles, responsibilities and authorities; A.3.2 AI roles and responsibilities', 'GOVERN 2.1 (roles and lines of communication); GOVERN 2.3 (leadership takes responsibility for decisions about AI risk)', 'Direct: what is delegated and what the governing body keeps'],
        ['B5 Information and tools', marked ? `${n(marked, 'combination', 'combinations')} of information class and tool kind marked` : none, 'Which information may go into which kind of tool', 'A.9.2 Processes for responsible use of AI systems; A.9.4 Intended use of the AI system', 'GOVERN 1.4; GOVERN 6.1 (policies for risks from third parties)', 'Direct: policy on the data and information AI may use'],
        ['B6 Harm thresholds', harms ? `${n(harms, 'threshold', 'thresholds')}; a material AI incident is one that reaches any of them` : none, 'What the board will not tolerate, in the company’s own terms', '6.1.2 AI risk assessment (the criteria risk is judged against); an input to A.5.2, not an AI system impact assessment', 'GOVERN 1.3; MAP 1.5', 'Evaluate and direct: the harm the governing body will not accept'],
        ['B7 Reporting', ms || evs ? `${n(ms, 'measure', 'measures')} at each meeting; ${n(evs, 'event', 'events')} reported between meetings` : none, 'What management reports to the board, and how fast', '9.1 Monitoring, measurement, analysis and evaluation; 9.3 Management review; A.3.3 Reporting of concerns, where a measure counts them', 'GOVERN 1.5 (monitoring and periodic review planned); GOVERN 4.3 (incidents identified and shared)', 'Monitor: what the governing body is told, and how fast'],
        ['B8 Accountability', owners ? `${n(owners, 'accountability', 'accountabilities')} named` : none, 'A named person for each accountability', '5.3 Roles, responsibilities and authorities; A.3.2 AI roles and responsibilities', 'GOVERN 2.1; GOVERN 2.3', 'Direct: accountability stays with the governing body; responsibility is assigned by name'],
        ['B9 Resolution and review', resolved ? `Resolved ${dl(r.on)}${r.minuteRef ? ', ' + r.minuteRef : ''}${r.interval ? '; review: ' + r.interval : ''}` : 'Not yet resolved', 'The board’s decision on the record, and when it is looked at again', '5.1 Leadership and commitment; A.2.4 Review of the AI policy', 'GOVERN 1.5; GOVERN 2.3', 'Direct and monitor: the decision on the record, and its review'],
      ];
      out.push(tableMd(['Step', 'What the board recorded', 'What it supplies', 'ISO/IEC 42001:2023', 'NIST AI RMF 1.0', 'ISO/IEC 38507:2022'], rows), '');
      out.push('## How to read this', '',
        '- Each row says what is recorded in this engagement and names the clause, control or subcategory it bears on. The board’s direction is one input to each; the rest of what a clause asks for sits with management’s own processes.',
        '- A row marked not yet recorded has nothing to place beside the framework yet.',
        '- The ISO/IEC 42001 entries give the clause or Annex A control by number and title. The NIST AI RMF entries give the subcategory with a short paraphrase, not the framework’s own words.',
        '- The ISO/IEC 38507:2022 entries name the task of a governing body that the step serves: to evaluate, to direct or to monitor. They give no clause numbers; read the standard in a licensed copy.',
        '- The board’s goals at B2 are AI objectives (clause 6.2), and the owners at B8 are roles and responsibilities (A.3.2). The harm thresholds at B6 are an input to an AI system impact assessment (A.5.2), not one.',
        '- This is not a statement of conformity with any of these frameworks, and it is not legal advice. Whether an obligation calls for any of these positions is a question for counsel.', '');
      // The two scales this app uses, beside ISO vocabulary (task ISO.4).
      Object.values((C && C.crosswalks) || {}).forEach(x => { out.push('## ' + x.title, '', x.intro, '', tableMd(x.head, x.rows), '', x.note, ''); });
      return out.join('\n');
    }

    return { statement, directions, aupOutline, minute, actionList, plan, crosswalk, confidentiality, reality, status };
  }

  /* The list of outputs shown on screen. kind: 'docx' or 'json'. mode: 'standalone', 'connected' or 'both'. */
  const LIST = [
    { id: 'statement', ref: 'BO1', name: 'AI risk appetite statement', for: 'The board, to resolve', mode: 'standalone', kind: 'docx' },
    { id: 'directions', ref: 'BO6', name: 'Board directions paper', for: 'The board, then the AI risk appetite engagement', mode: 'connected', kind: 'docx' },
    { id: 'aupOutline', ref: 'BO2', name: 'Acceptable-use policy outline', for: 'The GC, to draft the policy', mode: 'standalone', kind: 'docx' },
    { id: 'minute', ref: 'BO3', name: 'Board minute', for: 'The company secretary', mode: 'both', kind: 'docx' },
    { id: 'actionList', ref: 'BO4', name: '90-day action list', for: 'The CEO', mode: 'both', kind: 'docx' },
    { id: 'worklist', ref: 'BO5', name: 'Automated-decision worklist', for: 'The GC', mode: 'both', kind: 'docx' },
    { id: 'plan', ref: '', name: 'Engagement plan', for: 'Everyone in the engagement', mode: 'both', kind: 'docx' },
    { id: 'crosswalk', ref: 'BO8', name: 'Framework crosswalk', for: 'The technology owner and the AI governance team', mode: 'both', kind: 'docx' },
    { id: 'education', ref: '', name: 'Director education record', for: 'The chair and the company secretary', mode: 'both', kind: 'docx' },
    { id: 'confidentiality', ref: '', name: 'Confidentiality position file', for: 'A later confidential-matter assessment', mode: 'standalone', kind: 'json' },
    { id: 'evidence', ref: 'BO7', name: 'APRA letter evidence index', for: 'The CRO and the board: the response to APRA and the AI management review', mode: 'connected', kind: 'docx' },
  ];

  root.BDOutputs = { make, LIST };
})(typeof window !== 'undefined' ? window : globalThis);
