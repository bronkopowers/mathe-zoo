import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check } from '../js/tasks.js';
import { SKILLS4 } from '../js/tasks4.js';
import { generate } from '../js/catalog.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const N = 400;
const num = (s) => Number(String(s).replace(/[^\d]/g, ''));

test('Klasse 4: jeder Generator liefert lösbare Aufgaben auf allen Stufen', () => {
  for (const s of SKILLS4) {
    for (const level of [1, 2, 3]) {
      const r = rng(level * 77 + s.id.length);
      for (let i = 0; i < N; i++) {
        const t = generate(s.id, level, r);
        assert.equal(t.skill, s.id);
        assert.ok(t.hint && t.hint.text && t.solution, `${s.id} L${level}: Hilfe oder Lösung fehlt`);
        assert.ok(!/undefined|NaN/.test(JSON.stringify(t)), `${s.id} L${level}: ${JSON.stringify(t)}`);
        if (t.input === 'choice') assert.ok(t.choices.some((c) => c.value === t.answer));
        else {
          assert.ok(Number.isInteger(t.answer) && t.answer >= 0 && t.answer <= 1500000, `${s.id} L${level}: ${t.expr} -> ${t.answer}`);
          assert.ok(String(t.answer).length <= 7, 'Antwort passt ins Eingabefeld');
          assert.ok(check(t, String(t.answer)));
        }
      }
    }
  }
});

test('Runden rundet kaufmännisch', () => {
  const r = rng(1);
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < N; i++) {
      const t = generate('g4_runden', level, r);
      const n = num(t.expr);
      const p = { Zehner: 10, Hunderter: 100, Tausender: 1000, Zehntausender: 10000, Hunderttausender: 100000 }[t.prompt.match(/auf (\w+)\./)[1]];
      assert.equal(t.answer % p, 0);
      assert.ok(Math.abs(t.answer - n) <= p / 2, `${n} auf ${p} -> ${t.answer}`);
      if (n % p === p / 2) assert.equal(t.answer, n + p / 2, 'bei 5 wird aufgerundet');
    }
  }
});

test('Plus, Minus, Mal und Teilen stimmen', () => {
  const r = rng(9);
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < N; i++) {
      for (const [id, f] of [['g4_plus', (a, b) => a + b], ['g4_minus', (a, b) => a - b], ['g4_mal', (a, b) => a * b], ['g4_teilen', (a, b) => a / b]]) {
        const t = generate(id, level, r);
        const [a, b] = t.expr.split('=')[0].split(/[+−·:]/).map(num);
        assert.equal(f(a, b), t.answer, `${id}: ${t.expr}`);
      }
    }
  }
});

test('Teilen mit Rest: Rest ist kleiner als der Teiler', () => {
  const r = rng(4);
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < N; i++) {
      const t = generate('g4_rest', level, r);
      const m = t.solution.match(/^(\d+) : (\d+) = (\d+) Rest (\d+)/).slice(1).map(Number);
      assert.equal(m[1] * m[2] + m[3], m[0]);
      assert.ok(m[3] > 0 && m[3] < m[1]);
    }
  }
});

test('Größen: Komma-Aufgaben stimmen', () => {
  const r = rng(6);
  for (let i = 0; i < N; i++) {
    const t = generate('g4_groessen', 3, r);
    const m = t.expr.match(/^(\d+),(\d+) (\S+) = \? (\S+)/);
    const f = { km: 1000, m: 100, kg: 1000, t: 1000, '€': 100, l: 1000 }[m[3]];
    assert.equal(Math.round(Number(`${m[1]}.${m[2]}`) * f), t.answer, t.expr);
  }
});

test('Sachaufgaben in zwei Schritten: Ergebnis nie negativ, Text enthält Frage', () => {
  const r = rng(12);
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < N; i++) {
      const t = generate('g4_sach', level, r);
      assert.ok(t.answer >= 0 && t.text.includes('?'));
    }
  }
});
