import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSkillState, recordAnswer, scheduleAfterSession, planRound, placeStars, ensureSkills, DAY } from '../js/learner.js';
import { TOPICS, SKILLS } from '../js/catalog.js';

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

test('Themen-Orte: jede Fähigkeit existiert, jede Klasse hat drei Orte', () => {
  for (const g of Object.keys(TOPICS)) {
    assert.equal(TOPICS[g].length, 3);
    for (const ids of TOPICS[g]) for (const id of ids) assert.ok(SKILLS.some((s) => s.id === id), `${id} fehlt`);
  }
});

test('Runde am Ort: 10 gemischte Aufgaben aus dem Ort, fällige Wiederholungen von anderen Orten', () => {
  for (const g of [3, 4]) {
    const st = ensureSkills({});
    const [place, ...rest] = TOPICS[g];
    const others = rest.flat();
    for (let k = 0; k < 100; k++) {
      const plan = planRound(st.skills, place, others, 0);
      assert.equal(plan.length, 10);
      assert.ok(plan.every((id) => place.includes(id)), 'ohne fällige Wiederholung nur Themen des Ortes');
      for (let i = 1; i < plan.length; i++) assert.notEqual(plan[i], plan[i - 1]);
      assert.ok(new Set(plan).size >= Math.min(4, place.length), 'mindestens vier Themen gemischt');
    }
    const o = others[0];
    st.skills[o].attempts = 5;
    st.skills[o].box = 1;
    st.skills[o].due = 0;
    const plan = planRound(st.skills, place, others, DAY);
    assert.equal(plan.length, 10);
    assert.equal(plan.filter((id) => id === o).length, 1, 'fällige Wiederholung ist dabei');
  }
});

test('Sterne eines Ortes', () => {
  const st = ensureSkills({});
  const ids = TOPICS[3][0];
  assert.equal(placeStars(st.skills, ids, 0), 0);
  assert.equal(placeStars(st.skills, ids, 1), 1);
  ids.forEach((id) => { st.skills[id].attempts = 6; st.skills[id].level = 2; });
  assert.equal(placeStars(st.skills, ids, 2), 2);
  ids.forEach((id) => { st.skills[id].mastered = true; });
  assert.equal(placeStars(st.skills, ids, 5), 3);
});
