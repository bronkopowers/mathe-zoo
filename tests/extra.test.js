import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, parseMoney } from '../js/tasks.js';
import { SKILLS_EXTRA, greedy } from '../js/tasks_extra.js';
import { generate } from '../js/catalog.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const N = 400;

test('Etappe 2: jeder neue Generator liefert lösbare Aufgaben auf allen Stufen', () => {
  for (const s of SKILLS_EXTRA) {
    for (const level of [1, 2, 3]) {
      const r = rng(level * 31 + s.id.length);
      for (let i = 0; i < N; i++) {
        const t = generate(s.id, level, r);
        assert.equal(t.skill, s.id);
        assert.ok(t.hint?.text && t.solution, `${s.id} L${level}`);
        assert.ok(!/undefined|NaN/.test(JSON.stringify(t)), `${s.id} L${level}: ${JSON.stringify(t)}`);
        if (t.input === 'order') {
          assert.equal(new Set(t.items).size, t.items.length, 'keine doppelten Zahlen');
          assert.ok(t.items.length >= 4 && t.items.length <= 5);
          assert.ok(check(t, t.answer));
          assert.ok(!check(t, t.items), 'gemischte Reihenfolge ist nicht schon die Lösung');
          const sorted = [...t.items].sort((a, b) => a - b);
          assert.deepEqual(t.answer, t.desc ? sorted.reverse() : sorted);
        } else if (t.input === 'tapline') {
          const v = t.visual;
          assert.ok(t.answer > v.from && t.answer < v.to && (t.answer - v.from) % v.step === 0, 'Ziel liegt auf einem Strich');
          assert.ok(t.answer % v.label !== 0, 'Ziel ist nicht beschriftet');
          assert.ok((v.to - v.from) / v.step <= 10, 'höchstens 11 Striche, damit man sie treffen kann');
          assert.ok(check(t, t.answer) && !check(t, t.answer + v.step) && !check(t, null));
        } else if (t.input === 'coins') {
          const g = greedy(t.answer, t.denoms);
          assert.equal(g.reduce((a, b) => a + b, 0), t.answer, 'Betrag ist mit den Stücken legbar');
          assert.ok(g.length <= 9, `zu viele Stücke: ${g.length}`);
          assert.ok(check(t, t.answer) && !check(t, 0));
        } else {
          assert.ok(Number.isInteger(t.answer) && t.answer >= 0 && String(t.answer).length <= 7, `${s.id} L${level}: ${t.expr} -> ${t.answer}`);
          assert.ok(check(t, String(t.answer)) && !check(t, String(t.answer + 1)));
        }
      }
    }
  }
});

test('Platzhalter: eingesetzte Zahl macht die Gleichung wahr', () => {
  const r = rng(3);
  const val = (s) => Function(`return (${s.replace(/·/g, '*').replace(/:/g, '/').replace(/−/g, '-')})`)();
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < N; i++) {
      const t = generate('platzhalter', level, r);
      const [l, rr] = t.expr.replace('?', String(t.answer)).split('=');
      assert.equal(val(l), val(rr), t.expr);
    }
  }
});

test('Zeitspannen stimmen', () => {
  const r = rng(8);
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < N; i++) {
      const t = generate('zeit', level, r);
      const m = t.expr.match(/^(\d+):(\d+) Uhr → (\d+):(\d+) Uhr$/);
      if (m) assert.equal((+m[3] * 60 + +m[4]) - (+m[1] * 60 + +m[2]), t.answer, t.expr);
      else assert.ok(/h/.test(t.expr));
    }
  }
});

test('Rückgeld: Text und Betrag passen zusammen', () => {
  const r = rng(5);
  for (let i = 0; i < N; i++) {
    const t = generate('geld_legen', 3, r);
    const [price, pay] = [...t.text.matchAll(/(\d+,\d\d) €/g)].map((m) => parseMoney(m[1]));
    assert.equal(pay - price, t.answer);
    assert.ok(t.answer > 0);
  }
});
