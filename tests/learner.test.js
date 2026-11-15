import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSkillState, recordAnswer, scheduleAfterSession, planSession, ensureSkills, coinsFor, placementLevel, DAY } from '../js/learner.js';

test('4 von 5 richtig -> nächste Stufe', () => {
  const s = newSkillState();
  const ev = [true, true, false, true, true].map((c) => recordAnswer(s, c, 0));
  assert.equal(ev.at(-1), 'levelUp');
  assert.equal(s.level, 2);
});

test('nur 1 von 4 richtig -> eine Stufe leichter, nie unter 1', () => {
  const s = newSkillState();
  s.level = 2;
  [false, true, false, false].forEach((c) => recordAnswer(s, c, 0));
  assert.equal(s.level, 1);
  [false, false, false, false].forEach((c) => recordAnswer(s, c, 0));
  assert.equal(s.level, 1);
});

test('gemeistert erst auf Stufe 3 mit 7 von 8 und nach Pausen (Kasten >= 2)', () => {
  const s = newSkillState();
  s.level = 3;
  const run = () => [true, true, true, false, true, true, true, true].map((c) => recordAnswer(s, c, 0));
  assert.ok(!run().includes('mastered'), 'am ersten Tag noch nicht');
  s.box = 2;
  s.levelRecent = [];
  assert.equal(run().at(-1), 'mastered');
  assert.ok(s.mastered);
});

test('mehrere Runden am selben Tag schieben den Kasten nicht hoch', () => {
  const s = newSkillState();
  scheduleAfterSession(s, [true, true], 0, false);
  assert.equal(s.box, 1, 'erster Kontakt zählt');
  scheduleAfterSession(s, [true, true], 0, false);
  scheduleAfterSession(s, [true, true], 0, false);
  assert.equal(s.box, 1);
  scheduleAfterSession(s, [true, true], DAY, true);
  assert.equal(s.box, 2);
});

test('Wiedervorlage: gut geübt -> später, schlecht -> morgen', () => {
  const s = newSkillState();
  scheduleAfterSession(s, [true, true, true], 0);
  assert.equal(s.box, 1);
  assert.equal(s.due, 1 * DAY);
  scheduleAfterSession(s, [true, true, true], 0);
  scheduleAfterSession(s, [true, true, true], 0);
  assert.equal(s.due, 2 * DAY, 'nicht gemeistert -> höchstens 2 Tage');
  s.mastered = true;
  scheduleAfterSession(s, [true, true], 0);
  assert.equal(s.due, 7 * DAY);
  scheduleAfterSession(s, [false, false, true], 0);
  assert.equal(s.box, 1);
});

test('Runde: gemischt, keine Wiederholung direkt hintereinander, max 4 pro Thema, Fokus bevorzugt', () => {
  const state = ensureSkills({ focus: ['plus_ohne', 'sachaufgaben'] });
  let focusCount = 0, total = 0;
  for (let k = 0; k < 200; k++) {
    const plan = planSession(state, 0);
    assert.equal(plan.length, 12);
    for (let i = 1; i < plan.length; i++) assert.notEqual(plan[i], plan[i - 1]);
    const counts = {};
    plan.forEach((id) => (counts[id] = (counts[id] || 0) + 1));
    assert.ok(Object.values(counts).every((c) => c <= 4));
    focusCount += plan.filter((id) => state.focus.includes(id)).length;
    total += plan.length;
  }
  assert.ok(focusCount / total > 0.4, `Fokus-Anteil ${focusCount / total}`);
});

test('Münzen und Einstufung', () => {
  assert.equal(coinsFor({ firstTry: true, solved: true, level: 3, wasDue: true }), 4);
  assert.equal(coinsFor({ firstTry: false, solved: true, level: 3, wasDue: true }), 1);
  assert.equal(coinsFor({ firstTry: false, solved: false, level: 1, wasDue: false }), 0);
  assert.equal(placementLevel(false, false), 1);
  assert.equal(placementLevel(true, false), 2);
  assert.equal(placementLevel(true, true), 3);
});
