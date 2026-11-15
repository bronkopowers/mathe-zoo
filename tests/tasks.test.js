import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SKILLS, generate, check, parseMoney, euro, jumpSteps } from '../js/tasks.js';

// deterministischer Zufall für reproduzierbare Tests
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const N = 400;

test('jeder Generator liefert lösbare Aufgaben auf allen Stufen', () => {
  for (const s of SKILLS) {
    for (const level of [1, 2, 3]) {
      const r = rng(level * 1000 + s.id.length);
      for (let i = 0; i < N; i++) {
        const t = generate(s.id, level, r);
        assert.equal(t.skill, s.id);
        assert.ok(t.hint && t.hint.text, `${s.id} L${level}: Hilfe fehlt`);
        assert.ok(t.solution, `${s.id}: Lösungsweg fehlt`);
        if (t.input === 'choice') {
          assert.ok(t.choices.some((c) => c.value === t.answer), `${s.id}: Antwort nicht in Auswahl`);
          assert.ok(check(t, t.answer));
        } else {
          assert.ok(Number.isInteger(t.answer) && t.answer >= 0, `${s.id} L${level}: Antwort ${t.answer}`);
          const given = t.input === 'money' ? euro(t.answer).replace(' €', '') : String(t.answer);
          assert.ok(check(t, given), `${s.id} L${level}: Prüfung schlägt fehl für ${given}`);
          assert.ok(!check(t, String(t.answer + 1)) || t.input === 'money', `${s.id}: falsche Antwort akzeptiert`);
        }
      }
    }
  }
});

const parse = (expr) => expr.match(/^(\d+) ([+−]) (\d+)/).slice(1);

test('ohne Hunderterübergang bleibt im Hunderter, mit Übergang wechselt ihn', () => {
  const r = rng(7);
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < N; i++) {
      for (const id of ['plus_ohne', 'minus_ohne', 'plus_mit', 'minus_mit']) {
        const t = generate(id, level, r);
        const [a, op, b] = parse(t.expr);
        const A = +a, B = +b;
        const res = op === '+' ? A + B : A - B;
        assert.equal(res, t.answer);
        assert.ok(res >= 0 && res <= 1000, `${id}: ${t.expr} = ${res}`);
        const crossed = op === '+' ? (A % 100) + (B % 100) >= 100 : (A % 100) < (B % 100);
        assert.equal(crossed, id.endsWith('mit'), `${id}: ${t.expr}`);
      }
    }
  }
});

test('Zahlenmauern bleiben im Zahlenraum bis 1000', () => {
  const r = rng(3);
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < N; i++) {
      const t = generate('zahlenmauer', level, r);
      const { base, mid, top } = t.visual.bricks;
      assert.equal(mid[0], base[0] + base[1]);
      assert.equal(mid[1], base[1] + base[2]);
      assert.equal(top, mid[0] + mid[1]);
      assert.ok(top <= 1000);
      assert.ok(!t.visual.show.includes(t.visual.ask));
    }
  }
});

test('Teilen geht immer ohne Rest auf', () => {
  const r = rng(11);
  for (let i = 0; i < N; i++) {
    const t = generate('teilen', 3, r);
    const [n, d] = t.expr.match(/(\d+) : (\d+)/).slice(1).map(Number);
    assert.equal(n % d, 0);
    assert.equal(n / d, t.answer);
  }
});

test('Sachaufgaben: Ablenker nur auf Stufe 3, gebrauchte Zahlen stehen im Text', () => {
  const r = rng(5);
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < N; i++) {
      const t = generate('sachaufgaben', level, r);
      const nums = t.sach.tokens.filter((k) => 'num' in k).map((k) => k.num);
      for (const n of t.sach.needed) assert.ok(nums.includes(n));
      assert.equal(t.sach.distractor !== null, level === 3);
      if (level === 1) assert.ok(['dazu', 'weg', 'vergleich'].includes(t.sach.schema));
      assert.ok(t.sach.schemaChoices.some((c) => c.value === t.sach.schema));
    }
  }
});

test('Geld-Eingabe wird richtig gelesen', () => {
  assert.equal(parseMoney('3,45'), 345);
  assert.equal(parseMoney('3,5'), 350);
  assert.equal(parseMoney('3'), 300);
  assert.equal(parseMoney('0,05'), 5);
  assert.equal(parseMoney('12.30'), 1230);
  assert.ok(Number.isNaN(parseMoney('')));
  assert.ok(Number.isNaN(parseMoney('3,456')));
  assert.equal(euro(1205), '12,05 €');
});

test('Rechenschritte ergeben das Ergebnis', () => {
  assert.deepEqual(jumpSteps(445, 31, 1, false), [30, 1]);
  assert.deepEqual(jumpSteps(375, 40, 1, true), [25, 15]);
  assert.deepEqual(jumpSteps(412, 30, -1, true), [12, 18]);
  assert.deepEqual(jumpSteps(445, 300, 1, false), [300]);
});
