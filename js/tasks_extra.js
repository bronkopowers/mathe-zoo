// Weitere Aufgaben (Etappe 2): neue Themen und neue Rätselarten.
// Eingabe-Arten neben Zahl und Auswahl: 'order' (Zahlen der Reihe nach antippen),
// 'tapline' (Stelle auf dem Zahlenstrahl antippen), 'coins' (Betrag mit Münzen legen).

import { int, pick, shuffle, euro } from './tasks.js';
import { fmt } from './tasks4.js';

function until(make, ok, max = 3000) {
  for (let i = 0; i < max; i++) {
    const v = make();
    if (ok(v)) return v;
  }
  throw new Error('Generator hat keine passende Aufgabe gefunden');
}

// ---------- Zahlen ordnen (Reihenfolge antippen) ----------
function reihe(id, big) {
  return (level, r) => {
    let items;
    if (level === 1) {
      const set = new Set();
      while (set.size < 4) set.add(big ? int(r, 10000, 99999) : int(r, 100, 999));
      items = [...set];
    } else {
      // gleiche Ziffern, anders angeordnet: Man muss Stelle für Stelle vergleichen
      const digits = shuffle(r, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, big ? (level === 2 ? 5 : 6) : 3);
      const keep = big ? (level === 2 ? 1 : 2) : 0;
      const set = new Set();
      for (let i = 0; i < 400 && set.size < 5; i++) set.add(Number([...digits.slice(0, keep), ...shuffle(r, digits.slice(keep))].join('')));
      items = [...set];
    }
    const desc = level === 3;
    const answer = [...items].sort((a, b) => (desc ? b - a : a - b));
    const shown = until(() => shuffle(r, items), (s) => s.some((v, i) => v !== answer[i]));
    return {
      skill: id, level, prompt: `Ordne von ${desc ? 'groß nach klein' : 'klein nach groß'}. Tippe die Zahlen der Reihe nach an.`,
      input: 'order', items: shown, answer, desc,
      hint: { text: 'Vergleiche zuerst die vorderste Stelle. Ist sie gleich, schau auf die nächste Stelle.' },
      solution: answer.map(fmt).join(desc ? ' > ' : ' < '),
    };
  };
}

// ---------- Zahlenstrahl antippen ----------
function strahlTippen(id, big) {
  return (level, r) => {
    const k = big ? 10 : 1;
    let from, step, label, ticks;
    if (level === 1) { from = 0; step = 100 * k; label = 500 * k; ticks = 10; }
    else if (level === 2) { from = big ? 0 : int(r, 0, 9) * 100; step = big ? 10000 : 10; label = big ? 50000 : 50; ticks = 10; }
    else { from = big ? int(r, 1, 89) * 10000 : int(r, 0, 8) * 100; step = big ? 1000 : 20; label = big ? 10000 : 200; ticks = 10; }
    const to = from + step * ticks;
    const n = until(() => from + int(r, 1, ticks - 1) * step, (v) => v % label !== 0);
    return {
      skill: id, level, prompt: `Tippe auf die Zahl ${fmt(n)}.`,
      visual: { type: 'line', from, to, step, label, tap: true },
      input: 'tapline', answer: n,
      hint: { text: `Von Strich zu Strich sind es immer ${fmt(step)}. Zähle von einer beschrifteten Zahl aus.` },
      solution: `${fmt(n)} liegt ${(n - from) / step} Striche rechts von ${fmt(from)}.`,
    };
  };
}

// ---------- Mal & Geteilt mit Zehnerzahlen (Klasse 3) ----------
const zehnerMal = (level, r) => {
  const base = { skill: 'zehner_mal', level, input: 'number' };
  if (level === 1) {
    const a = int(r, 2, 9), b = int(r, 2, 9);
    return { ...base, prompt: 'Rechne.', expr: `${a} · ${b * 10} = ?`, answer: a * b * 10, hint: { text: `Rechne erst ${a} · ${b} = ${a * b}. Das sind ${a * b} Zehner, also häng eine 0 an.` }, solution: `${a} · ${b * 10} = ${a * b * 10}` };
  }
  if (level === 2) {
    const a = int(r, 2, 9), b = int(r, 2, 9);
    return { ...base, prompt: 'Rechne.', expr: `${a * b * 10} : ${a} = ?`, answer: b * 10, hint: { text: `Denk an die kleine Aufgabe: ${a * b} : ${a} = ${b}. Dann häng die 0 wieder an.` }, solution: `${a * b * 10} : ${a} = ${b * 10}` };
  }
  const [a, b] = until(() => [int(r, 2, 5), int(r, 2, 5)], ([x, y]) => x * y <= 10);
  const hundred = r() < 0.5;
  const [p, q] = hundred ? [a, b * 100] : [a * 10, b * 10];
  return { ...base, prompt: 'Rechne.', expr: `${p} · ${q} = ?`, answer: p * q, hint: { text: `Rechne erst ohne die Nullen: ${a} · ${b} = ${a * b}. Dann häng zwei Nullen an.` }, solution: `${p} · ${q} = ${p * q}` };
};

// ---------- Verdoppeln und Halbieren ----------
const doppeltHalb = (level, r) => {
  const dbl = r() < 0.5;
  const [lo, hi] = [[12, 50], [55, 250], [255, 500]][level - 1];
  const n = dbl ? int(r, lo, hi) : until(() => int(r, lo, hi) * 2, (v) => level < 3 || v % 20 !== 0);
  const ans = dbl ? n * 2 : n / 2;
  const z = Math.floor(n / 10) * 10, e = n % 10;
  return {
    skill: 'doppelt_halb', level, prompt: dbl ? 'Verdopple die Zahl.' : 'Halbiere die Zahl.',
    expr: dbl ? `${n} + ${n} = ?` : `${n} : 2 = ?`, input: 'number', answer: ans,
    hint: { text: dbl ? `Zerlege: das Doppelte von ${z} und das Doppelte von ${e}.` : `Zerlege ${n} in zwei Teile, die sich leicht halbieren lassen, zum Beispiel ${Math.floor(n / 20) * 20} und ${n - Math.floor(n / 20) * 20}.` },
    solution: dbl ? `${z * 2} + ${e * 2} = ${ans}` : `${n} : 2 = ${ans}`,
  };
};

// ---------- Größen Klasse 3 ----------
const U3 = [['m', 'cm', 100], ['km', 'm', 1000], ['kg', 'g', 1000], ['cm', 'mm', 10]];
const groessen3 = (level, r) => {
  const base = { skill: 'g3_groessen', level, input: 'number', prompt: 'Wandle um.' };
  const [big, small, f] = level === 3 ? pick(r, U3.slice(0, 3)) : pick(r, U3);
  if (level === 1) {
    const k = int(r, 2, 9);
    return { ...base, expr: `${k} ${big} = ? ${small}`, answer: k * f, hint: { text: `1 ${big} = ${fmt(f)} ${small}` }, solution: `${k} ${big} = ${fmt(k * f)} ${small}` };
  }
  if (level === 2) {
    const k = int(r, 1, 9), m = f === 10 ? int(r, 1, 9) : int(r, 1, 9) * (f / 20);
    return { ...base, expr: `${k} ${big} ${m} ${small} = ? ${small}`, answer: k * f + m, hint: { text: `1 ${big} = ${fmt(f)} ${small}. Wandle zuerst ${k} ${big} um, dann zähle ${m} ${small} dazu.` }, solution: `${fmt(k * f)} ${small} + ${m} ${small} = ${fmt(k * f + m)} ${small}` };
  }
  const [txt, mul, word] = pick(r, [['½', 0.5, 'Die Hälfte'], ['¼', 0.25, 'Ein Viertel'], ['1½', 1.5, 'Eineinhalb'], ['2½', 2.5, 'Zweieinhalb']]);
  return { ...base, expr: `${txt} ${big} = ? ${small}`, answer: f * mul, hint: { text: `1 ${big} = ${fmt(f)} ${small}. ${word} davon sind …` }, solution: `${txt} ${big} = ${fmt(f * mul)} ${small}` };
};

// ---------- Zeitspannen ----------
const hm = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const zeit = (level, r) => {
  const base = { skill: 'zeit', level, input: 'number', unit: 'min' };
  if ((level === 1 && r() < 0.3) || (level === 3 && r() < 0.3)) {
    const k = level === 1 ? int(r, 2, 5) : int(r, 1, 3), m = level === 1 ? 0 : int(r, 1, 11) * 5;
    return { ...base, prompt: 'Wie viele Minuten sind das?', expr: m ? `${k} h ${m} min = ? min` : `${k} h = ? min`, unit: undefined, answer: k * 60 + m, hint: { text: `1 h = 60 min. ${k} h sind ${k} · 60 Minuten.` }, solution: `${k * 60}${m ? ` + ${m}` : ''} = ${k * 60 + m} min` };
  }
  const h = int(r, 7, 17);
  let m1, dur;
  if (level === 1) { m1 = int(r, 0, 8) * 5; dur = int(r, 2, (55 - m1) / 5) * 5; }
  else if (level === 2) { m1 = int(r, 6, 11) * 5; dur = until(() => int(r, 4, 11) * 5, (d) => m1 + d > 60); }
  else { m1 = int(r, 1, 11) * 5; dur = int(r, 13, 35) * 5; }
  const s = h * 60 + m1, e = s + dur;
  const toFull = 60 - m1;
  return {
    ...base, prompt: 'Wie viele Minuten vergehen?', expr: `${hm(s)} Uhr → ${hm(e)} Uhr`, answer: dur,
    hint: { text: level === 1 ? `Zähle in Fünferschritten von ${hm(s)} bis ${hm(e)}.` : `Geh zuerst bis zur vollen Stunde: Bis ${h + 1}:00 Uhr sind es ${toFull} Minuten. Dann zähle weiter bis ${hm(e)} Uhr.` },
    solution: level === 1 ? `${e % 60} − ${m1} = ${dur} Minuten` : `${toFull} Minuten bis ${h + 1}:00 Uhr, dann noch ${dur - toFull} Minuten: zusammen ${dur}`,
  };
};

// ---------- Geld legen (Münzen und Scheine antippen) ----------
const dl = (d) => (d >= 100 ? `${d / 100} €` : `${d} ct`);
export function greedy(ct, denoms) {
  const out = [];
  for (const d of denoms) while (ct >= d) { out.push(d); ct -= d; }
  return out;
}
const THINGS = ['Die Eintrittskarte', 'Das Eis', 'Der Lageplan', 'Die Futtertüte', 'Die Postkarte'];
const geldLegen = (level, r) => {
  const small = [500, 200, 100, 50, 20, 10];
  let amt, denoms = small, text;
  if (level === 1) { amt = int(r, 3, 19) * 100; denoms = [1000, 500, 200, 100]; }
  else if (level === 2) amt = until(() => int(r, 11, 99) * 10, (v) => v % 100 !== 0);
  else {
    const price = until(() => int(r, 12, 95) * 10, (v) => v % 100 !== 0);
    const pay = price < 500 ? pick(r, [500, 1000]) : 1000;
    amt = pay - price;
    text = `${pick(r, THINGS)} kostet ${euro(price)}. Du bezahlst mit ${euro(pay)}.`;
  }
  const g = greedy(amt, denoms);
  return {
    skill: 'geld_legen', level, prompt: text ? 'Lege das Rückgeld.' : 'Lege den Betrag mit Scheinen und Münzen.',
    text, expr: text ? undefined : euro(amt), input: 'coins', denoms, answer: amt,
    hint: { text: text ? 'Rechne zuerst aus, wie viel Rückgeld es gibt. Ergänze dazu vom Preis bis zum bezahlten Betrag.' : `Fang mit dem größten Stück an, das noch passt: ${dl(g[0])}. Dann schau, was noch fehlt.` },
    solution: `${g.map(dl).join(' + ')} = ${euro(amt)}`,
  };
};

// ---------- Platzhalter-Aufgaben ----------
const platzhalter = (level, r) => {
  const base = { skill: 'platzhalter', level, input: 'number', prompt: 'Welche Zahl fehlt?' };
  const back = 'Rechne rückwärts mit der Umkehraufgabe: ';
  if (level === 3) {
    if (r() < 0.5) {
      const b = int(r, 20, 60), c = int(r, 15, 39), a = int(r, 5, b + c - 5);
      return { ...base, expr: `${a} + ? = ${b} + ${c}`, answer: b + c - a, hint: { text: `Rechne zuerst die rechte Seite aus: ${b} + ${c}. Beide Seiten müssen gleich groß sein.` }, solution: `${b} + ${c} = ${b + c}, und ${a} + ${b + c - a} = ${b + c}` };
    }
    const b = int(r, 3, 9), c = int(r, 3, 9), a = int(r, 5, 40);
    return { ...base, expr: `? − ${a} = ${b} · ${c}`, answer: b * c + a, hint: { text: `Rechne zuerst die rechte Seite aus: ${b} · ${c}. Dann ${back}plus ${a}.` }, solution: `${b} · ${c} = ${b * c}, und ${b * c + a} − ${a} = ${b * c}` };
  }
  const forms = level === 1 ? ['?+', '+?', '-?', '?-'] : ['?+', '+?', '-?', '?-', '?*', ':?'];
  const f = pick(r, forms);
  if (f === '?*' || f === ':?') {
    const a = int(r, 2, 9), b = int(r, 2, 9);
    return f === '?*'
      ? { ...base, expr: `? · ${b} = ${a * b}`, answer: a, hint: { text: `${back}${a * b} : ${b}.` }, solution: `${a} · ${b} = ${a * b}` }
      : { ...base, expr: `${a * b} : ? = ${a}`, answer: b, hint: { text: `Wie oft passt die ${a} in die ${a * b}?` }, solution: `${a * b} : ${b} = ${a}` };
  }
  const k = level === 1 ? 1 : 10;
  const x = int(r, 5, 60) * k, y = int(r, 5, 39) * k;
  const sum = x + y;
  switch (f) {
    case '?+': return { ...base, expr: `? + ${y} = ${sum}`, answer: x, hint: { text: `${back}${sum} − ${y}.` }, solution: `${x} + ${y} = ${sum}` };
    case '+?': return { ...base, expr: `${x} + ? = ${sum}`, answer: y, hint: { text: `Ergänze von ${x} bis ${sum}. Oder rechne ${sum} − ${x}.` }, solution: `${x} + ${y} = ${sum}` };
    case '-?': return { ...base, expr: `${sum} − ? = ${x}`, answer: y, hint: { text: `Wie viel muss weg, damit von ${sum} noch ${x} bleiben? Rechne ${sum} − ${x}.` }, solution: `${sum} − ${y} = ${x}` };
    default: return { ...base, expr: `? − ${y} = ${x}`, answer: sum, hint: { text: `${back}${x} + ${y}.` }, solution: `${sum} − ${y} = ${x}` };
  }
};

export const SKILLS_EXTRA = [
  { id: 'reihe', name: 'Zahlen ordnen', grade: 3, gen: reihe('reihe', false) },
  { id: 'strahl_tippen', name: 'Zahlenstrahl antippen', grade: 3, gen: strahlTippen('strahl_tippen', false) },
  { id: 'zehner_mal', name: 'Mal und Geteilt mit Zehnern', grade: 3, gen: zehnerMal },
  { id: 'doppelt_halb', name: 'Verdoppeln und Halbieren', grade: 3, gen: doppeltHalb },
  { id: 'g3_groessen', name: 'Längen und Gewichte', grade: 3, gen: groessen3 },
  { id: 'zeit', name: 'Zeitspannen', grade: 3, gen: zeit },
  { id: 'geld_legen', name: 'Geld legen', grade: 3, gen: geldLegen },
  { id: 'platzhalter', name: 'Platzhalter-Aufgaben', grade: 3, gen: platzhalter },
  { id: 'g4_reihe', name: 'Große Zahlen ordnen', grade: 4, gen: reihe('g4_reihe', true) },
  { id: 'g4_strahl_tippen', name: 'Zahlenstrahl groß antippen', grade: 4, gen: strahlTippen('g4_strahl_tippen', true) },
];
