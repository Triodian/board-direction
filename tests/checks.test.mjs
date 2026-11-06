// The checks BK1 to BK7 (framework 10.1): a complete engagement passes all seven; each check fails on a crafted case.
// Run: node tests/checks.test.mjs
import { runChecks, CLASSES, KINDS } from '../public/shared/checks.js';

let fails = 0;
const ok = (label, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS' : 'FAIL') + ' · ' + label + (extra ? ' → ' + extra : '')); };

const complete = () => {
  const cells = {}; CLASSES.forEach((g, i) => KINDS.forEach(k => { cells[g + ':' + k] = i < 2 ? 'P' : i < 4 ? 'C' : 'N'; }));
  return {
    areas: [{ id: 'A1', name: 'Sales' }, { id: 'A2', name: 'Finance' }],
    inventory: [
      { id: 'L1', use: 'Drafting', area: 'A1', authority: 'A1', info: 'G3', kind: 'K2', adm: false },
      { id: 'L2', use: 'Credit scoring', area: 'A2', authority: 'A2', info: 'G4', kind: 'K2', adm: true },
    ],
    questions: [{ ref: 'QC-01', step: 'B1', lines: ['L2'], question: 'x', status: 'open' }],
    positions: {
      B2: { goals: [{ id: 'GL1', goal: 'Use AI safely', owner: 'CEO', measure: 'BM1', proposedBy: 'p' }], A1: { posture: 'S3', proposedBy: 'p' }, A2: { posture: 'S2', proposedBy: 'p' } },
      B3: { lines: [{ id: 'RL1', use: 'AI releasing payments unattended', scope: 'All areas', appliesTo: 'The company', testedAgainst: 'none', proposedBy: 'p' }] },
      B4: { events: [{ id: 'RV1', event: 'A new AI use at A3 or above', timing: 'Before it starts', by: 'CEO', proposedBy: 'p' }] },
      B5: { cells, proposedBy: 'p' },
      B6: { harms: Object.fromEntries(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].map(h => [h, { statement: 's', threshold: 't', proposedBy: 'p' }])) },
      B7: { measures: [{ id: 'BM1', measure: 'm', limit: '0', owner: 'CEO' }], events: [{ id: 'EV1', event: 'e', to: 'Chair', within: '24 hours' }], proposedBy: 'p' },
      B8: { owners: { AC1: 'Audit committee', AC2: '', AC3: 'CEO', AC4: 'Each executive', AC5: 'CEO, 90 days' }, proposedBy: 'p' },
    },
  };
};
const failing = (S, id) => runChecks(S).find(c => c.id === id);
const all = runChecks(complete());
ok('a complete engagement passes all seven checks', all.every(c => c.ok), all.filter(c => !c.ok).map(c => c.id + ': ' + c.items.map(i => i.text).join('; ')).join(' | '));

const crafted = (id, label, mutate, want) => {
  const S = complete(); mutate(S); const c = failing(S, id);
  ok(`${id} fails: ${label}`, !c.ok && c.items.some(i => i.text.includes(want)), c.items.map(i => i.text).join('; '));
  const others = runChecks(S).filter(x => x.id !== id && !x.ok).map(x => x.id);
  return others;
};
crafted('BK1', 'an area with no posture', S => { delete S.positions.B2.A2; }, 'Finance: no posture recorded');
crafted('BK1', 'a posture not set without owner and date', S => { S.positions.B2.A2 = { posture: 'NS', notSetOwner: 'CEO' }; }, 'without who will set it');
crafted('BK1', 'a position without a proposer', S => { delete S.positions.B6.harms.H3.proposedBy; }, 'H3: no proposer');
crafted('BK1', 'a blank cell in the confidential-information table', S => { delete S.positions.B5.cells['G6:K7']; }, '1 of 36 cells');
ok('BK1 passes a posture not set with owner and date', failing((() => { const S = complete(); S.positions.B2.A2 = { posture: 'NS', notSetOwner: 'CEO', notSetBy: '30 Nov' }; return S; })(), 'BK1').ok);
crafted('BK2', 'a marking that loosens moving down', S => { S.positions.B5.cells['G5:K1'] = 'P'; }, 'G5 in K1 is less strict than G4');
crafted('BK3', 'a posture that accepts a level a red line rules out', S => { S.positions.B3.lines.push({ id: 'RL2', use: 'Any A4 use in Sales without approval', scope: 'Sales', appliesTo: 'The company', testedAgainst: 'none', proposedBy: 'p' }); }, 'Sales: the posture accepts A4');
ok('BK3 passes when the area records a condition', failing((() => { const S = complete(); S.positions.B2.A1.condition = 'Only pricing, approved by the board'; S.positions.B3.lines.push({ id: 'RL2', use: 'Any A4 use in Sales without approval', scope: 'Sales', appliesTo: 'The company', testedAgainst: 'none', proposedBy: 'p' }); return S; })(), 'BK3').ok);
crafted('BK4', 'a red line not tested against the inventory', S => { delete S.positions.B3.lines[0].testedAgainst; }, 'not yet tested');
crafted('BK4', 'a red line too short to test', S => { S.positions.B3.lines[0].use = 'No chatbots'; }, 'too short');
crafted('BK4', 'a red line tested against a line since removed', S => { S.positions.B3.lines[0].testedAgainst = 'L9'; }, 'no longer in the inventory');
crafted('BK5', 'a goal without a measure (plan task 1.13)', S => { S.positions.B2.goals[0].measure = ''; }, 'GL1: no measure');
crafted('BK5', 'a goal without an owner', S => { S.positions.B2.goals[0].owner = ''; }, 'GL1: no owner');
crafted('BK5', 'a measure without an owner', S => { S.positions.B7.measures[0].owner = ''; }, 'BM1: no owner');
crafted('BK5', 'no owner for each area', S => { S.positions.B8.owners.AC4 = ''; }, 'AC4');
crafted('BK6', 'a line seeing G5 through a kind with no marking', S => { S.inventory.push({ id: 'L3', use: 'x', info: 'G5', kind: 'K3' }); delete S.positions.B5.cells['G5:K3']; }, 'L3 sees G5 through K3');
crafted('BK7', 'a line about individuals with no question to counsel', S => { S.questions = []; }, 'L2 is marked as deciding about individuals');

console.log(fails ? `\n${fails} failed` : '\nAll passed');
process.exit(fails ? 1 : 0);
