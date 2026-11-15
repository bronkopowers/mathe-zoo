// Aufgaben-Generatoren für Klasse 4 (Zahlenraum bis 1 Million, schriftliches Rechnen, Größen).
// Gleiche Form wie tasks.js: gen(level 1..3, rng) -> Aufgabe.

import { int, pick } from './tasks.js';

const NB = ' '; // schmales Leerzeichen als Tausender-Trenner
export const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB);

function until(make, ok, max = 3000) {
  for (let i = 0; i < max; i++) {
    const v = make();
    if (ok(v)) return v;
  }
  throw new Error('Generator hat keine passende Aufgabe gefunden');
}

const PLACE = { 10: 'Zehner', 100: 'Hunderter', 1000: 'Tausender', 10000: 'Zehntausender', 100000: 'Hunderttausender' };
const CMP = [{ label: '<', value: '<' }, { label: '=', value: '=' }, { label: '>', value: '>' }];
const cmp = (a, b) => (a < b ? '<' : a > b ? '>' : '=');
const roundTo = (n, p) => Math.round(n / p) * p;

// ---------- Zahlen ----------

const stellenwert = (level, r) => {
  if (level === 1) {
    const n = int(r, 10000, 99999);
    const d = String(n).split('').map(Number);
    if (r() < 0.5) {
      return {
        skill: 'g4_stellenwert', level, prompt: 'Welche Zahl ist das?',
        expr: `${d[0]} ZT ${d[1]} T ${d[2]} H ${d[3]} Z ${d[4]} E = ?`, input: 'number', answer: n,
        hint: { text: 'Trag die Ziffern in die Stellenwerttafel ein. Eine 0 hält den Platz frei.', visual: { type: 'placeTable', n } },
        solution: `${fmt(n)}`,
      };
    }
    const names = ['Zehntausender', 'Tausender', 'Hunderter', 'Zehner', 'Einer'];
    const i = int(r, 0, 4);
    return {
      skill: 'g4_stellenwert', level, prompt: `Welche Ziffer steht an der ${names[i]}stelle?`,
      expr: fmt(n), input: 'number', answer: d[i],
      hint: { text: 'Schreib die Zahl in die Stellenwerttafel.', visual: { type: 'placeTable', n } },
      solution: `${fmt(n)}: An der ${names[i]}stelle steht die ${d[i]}.`,
    };
  }
  if (level === 2) {
    if (r() < 0.5) {
      const [n, i] = until(() => { const v = int(r, 100000, 999999); return [v, int(r, 0, 5)]; }, ([v, k]) => {
        const s = String(v);
        return s[k] !== '0' && s.split(s[k]).length === 2;
      });
      const s = String(n);
      const val = Number(s[i]) * 10 ** (5 - i);
      return {
        skill: 'g4_stellenwert', level, prompt: `Welchen Wert hat die Ziffer ${s[i]} in dieser Zahl?`,
        expr: fmt(n), input: 'number', answer: val,
        hint: { text: 'Schau, in welcher Spalte die Ziffer steht.', visual: { type: 'placeTable', n } },
        solution: `Die ${s[i]} steht für ${fmt(val)}.`,
      };
    }
    const parts = until(() => [100000, 10000, 1000, 100, 10, 1].map((p) => (r() < 0.6 ? int(r, 1, 9) * p : 0)), (a) => a[0] > 0 && a.filter(Boolean).length >= 3 && a.filter(Boolean).length <= 4);
    const n = parts.reduce((a, b) => a + b, 0);
    return {
      skill: 'g4_stellenwert', level, prompt: 'Welche Zahl ist das?',
      expr: `${parts.filter(Boolean).map(fmt).join(' + ')} = ?`, input: 'number', answer: n,
      hint: { text: 'Achte auf die Stellen, die fehlen. Dort steht eine 0.', visual: { type: 'placeTable', n } },
      solution: fmt(n),
    };
  }
  if (r() < 0.5) {
    const t = int(r, 12, 89), h = int(r, 11, 29);
    const n = t * 1000 + h * 100;
    return {
      skill: 'g4_stellenwert', level, prompt: 'Welche Zahl ist das? Achtung, bündeln!',
      expr: `${t} T + ${h} H = ?`, input: 'number', answer: n,
      hint: { text: `10 Hunderter sind 1 Tausender. ${h} H = ${Math.floor(h / 10)} T und ${h % 10} H.` },
      solution: `${fmt(t * 1000)} + ${fmt(h * 100)} = ${fmt(n)}`,
    };
  }
  const p = pick(r, [100, 1000]);
  const n = int(r, 12, 98) * p * 10;
  return {
    skill: 'g4_stellenwert', level, prompt: `Wie viele ${PLACE[p]} sind das insgesamt?`,
    expr: `${fmt(n)} = ? ${p === 100 ? 'H' : 'T'}`, input: 'number', answer: n / p,
    hint: { text: `Teile durch ${fmt(p)}: Streiche ${p === 100 ? 'zwei' : 'drei'} Nullen.` },
    solution: `${fmt(n)} = ${fmt(n / p)} ${PLACE[p]}`,
  };
};

const nachbar = (level, r) => {
  if (level === 3) {
    const base = int(r, 1, 9) * pick(r, [1000, 10000, 100000]) + (r() < 0.5 ? 0 : int(r, 1, 9) * 1000);
    const before = r() < 0.5;
    const n = before ? base : base - 1;
    return {
      skill: 'g4_nachbar', level, prompt: before ? 'Welche Zahl kommt direkt davor? (Vorgänger)' : 'Welche Zahl kommt direkt danach? (Nachfolger)',
      expr: before ? `? ← ${fmt(n)}` : `${fmt(n)} → ?`, input: 'number', answer: before ? n - 1 : n + 1,
      hint: { text: before ? '1 weniger: Aus den Nullen am Ende werden Neunen.' : '1 mehr: Aus den Neunen am Ende werden Nullen.' },
      solution: before ? `${fmt(n)} − 1 = ${fmt(n - 1)}` : `${fmt(n)} + 1 = ${fmt(n + 1)}`,
    };
  }
  const p = level === 1 ? 1000 : 10000;
  const n = until(() => (level === 1 ? int(r, 1100, 98900) : int(r, 11000, 989000)), (v) => v % p !== 0);
  const lower = r() < 0.5;
  const lo = Math.floor(n / p) * p;
  return {
    skill: 'g4_nachbar', level, prompt: `Welcher ${PLACE[p]} kommt ${lower ? 'vor' : 'nach'} der Zahl?`,
    expr: lower ? `? < ${fmt(n)}` : `${fmt(n)} < ?`, input: 'number', answer: lower ? lo : lo + p,
    hint: { text: `Nachbar${PLACE[p].toLowerCase()} enden auf ${String(p).slice(1)}.` },
    solution: `${fmt(lo)} < ${fmt(n)} < ${fmt(lo + p)}`,
  };
};

const ordnen = (level, r) => {
  if (level === 3) {
    const a = int(r, 2, 9) * 10000, b = int(r, 11, 99) * 100;
    const c = r() < 0.25 ? a + b : a + b + pick(r, [-1000, -100, -10, 10, 100, 1000]);
    return {
      skill: 'g4_ordnen', level, prompt: 'Setze das richtige Zeichen ein.',
      expr: `${fmt(a)} + ${fmt(b)} ○ ${fmt(c)}`, input: 'choice', choices: CMP, answer: cmp(a + b, c),
      hint: { text: `Rechne zuerst links aus: ${fmt(a)} + ${fmt(b)}. Dann vergleiche Stelle für Stelle.` },
      solution: `${fmt(a + b)} ${cmp(a + b, c)} ${fmt(c)}`,
    };
  }
  const a = level === 1 ? int(r, 10000, 99999) : int(r, 100000, 999999);
  const b = level === 1
    ? until(() => int(r, 10000, 99999), (v) => String(v)[0] !== String(a)[0])
    : until(() => Math.floor(a / 1000) * 1000 + int(r, 0, 999), (v) => v !== a || r() < 0.15);
  return {
    skill: 'g4_ordnen', level, prompt: 'Setze das richtige Zeichen ein.',
    expr: `${fmt(a)} ○ ${fmt(b)}`, input: 'choice', choices: CMP, answer: cmp(a, b),
    hint: { text: 'Vergleiche von links nach rechts, Stelle für Stelle. Die erste Stelle, die anders ist, entscheidet.' },
    solution: `${fmt(a)} ${cmp(a, b)} ${fmt(b)}`,
  };
};

const runden = (level, r) => {
  const [lo, hi, places] = level === 1 ? [1000, 9999, [10, 100]] : level === 2 ? [10000, 99999, [100, 1000]] : [100000, 999999, [10000, 100000]];
  const p = pick(r, places);
  const n = until(() => int(r, lo, hi), (v) => v % p !== 0);
  const ans = roundTo(n, p);
  const next = Math.floor((n % p) / (p / 10));
  return {
    skill: 'g4_runden', level, prompt: `Runde auf ${PLACE[p]}.`,
    expr: `${fmt(n)} ≈ ?`, input: 'number', answer: ans,
    hint: { text: `Schau auf die Ziffer rechts neben der ${PLACE[p]}stelle: Das ist die ${next}. Bei 0 bis 4 rundest du ab, bei 5 bis 9 auf.` },
    solution: `${fmt(n)} ≈ ${fmt(ans)} (die ${next} entscheidet: ${next >= 5 ? 'aufrunden' : 'abrunden'})`,
  };
};

const zahlenstrahl = (level, r) => {
  let from, to, step, label, n;
  if (level === 1) { from = 0; to = 10000; step = 500; label = 1000; n = int(r, 1, 19) * 500; }
  else if (level === 2) { from = 0; to = 100000; step = 5000; label = 20000; n = until(() => int(r, 1, 19) * 5000, (v) => v % 20000 !== 0); }
  else { from = int(r, 1, 89) * 10000; to = from + 10000; step = 500; label = 2000; n = from + until(() => int(r, 1, 19) * 500, (v) => v % 2000 !== 0); }
  return {
    skill: 'g4_zahlenstrahl', level, prompt: 'Welche Zahl zeigt der Pfeil?',
    visual: { type: 'line', from, to, step, label, arrow: n },
    input: 'number', answer: n,
    hint: { text: `Von Strich zu Strich sind es immer ${fmt(step)}. Zähle vom nächsten beschrifteten Strich aus.` },
    solution: `Der Pfeil zeigt auf ${fmt(n)}.`,
  };
};

// ---------- Plus / Minus ----------

function plusMinus(skill, sign) {
  const op = sign > 0 ? '+' : '−';
  return (level, r) => {
    let a, b;
    if (level === 1) {
      [a, b] = until(() => [int(r, 11, 98) * 100, int(r, 11, 98) * 100], ([x, y]) => (sign > 0 ? x + y <= 10000 : x > y));
    } else if (level === 2) {
      [a, b] = until(() => [int(r, 1001, 9999), int(r, 1001, 9999)], ([x, y]) => (sign > 0 ? true : x > y + 100));
    } else {
      [a, b] = until(() => [int(r, 10001, 499999), int(r, 10001, 99999)], ([x, y]) => (sign > 0 ? true : x > y + 1000));
    }
    const res = a + sign * b;
    return {
      skill, level, prompt: level === 1 ? 'Rechne im Kopf.' : 'Rechne schriftlich.',
      expr: `${fmt(a)} ${op} ${fmt(b)} = ?`, input: 'number', answer: res,
      hint: level === 1
        ? { text: `Rechne mit Hundertern: ${a / 100} H ${op} ${b / 100} H = ? H.` }
        : { text: `Schreib die Zahlen stellengerecht untereinander. Fang bei den Einern an und denk an ${sign > 0 ? 'den Übertrag' : 'das Entbündeln'}.`, visual: { type: 'column', a, b, op } },
      solution: `${fmt(a)} ${op} ${fmt(b)} = ${fmt(res)}`,
    };
  };
}

const ueberschlag = (level, r) => {
  const p = [100, 1000, 10000][level - 1];
  const sign = level === 1 ? 1 : pick(r, [1, -1]);
  const [a, b] = until(() => [int(r, p * 2, p * 10 - 1), int(r, p * 1.5, p * 10 - 1)], ([x, y]) => x % p !== 0 && y % p !== 0 && (sign > 0 || roundTo(x, p) > roundTo(y, p)));
  const ra = roundTo(a, p), rb = roundTo(b, p);
  const op = sign > 0 ? '+' : '−';
  return {
    skill: 'g4_ueberschlag', level, prompt: `Überschlage: Runde beide Zahlen auf ${PLACE[p]} und rechne dann.`,
    expr: `${fmt(a)} ${op} ${fmt(b)} ≈ ?`, input: 'number', answer: ra + sign * rb,
    hint: { text: `Gerundet: ${fmt(a)} ≈ ${fmt(ra)} und ${fmt(b)} ≈ ${fmt(rb)}. Jetzt rechne mit den runden Zahlen.` },
    solution: `${fmt(ra)} ${op} ${fmt(rb)} = ${fmt(ra + sign * rb)}`,
  };
};

// ---------- Mal / Geteilt ----------

const mal = (level, r) => {
  if (level === 1) {
    const a = int(r, 2, 9), b = int(r, 2, 9) * pick(r, [10, 100]);
    const both = r() < 0.3;
    const x = both ? a * 10 : a;
    const [p, q] = r() < 0.5 ? [x, b] : [b, x];
    const core = `${a} · ${b / (b % 100 === 0 ? 100 : 10)} = ${a * (b / (b % 100 === 0 ? 100 : 10))}`;
    return {
      skill: 'g4_mal', level, prompt: 'Rechne im Kopf.',
      expr: `${fmt(p)} · ${fmt(q)} = ?`, input: 'number', answer: p * q,
      hint: { text: `Rechne erst ohne die Nullen (${core}). Häng dann alle Nullen wieder an.` },
      solution: `${fmt(p)} · ${fmt(q)} = ${fmt(p * q)}`,
    };
  }
  const b = int(r, 2, 9);
  const a = level === 2 ? until(() => int(r, 12, 99), (v) => v % 10 !== 0) : until(() => int(r, 112, 999), (v) => v % 10 !== 0);
  const parts = [Math.floor(a / 100) * 100, Math.floor((a % 100) / 10) * 10, a % 10].filter(Boolean);
  return {
    skill: 'g4_mal', level, prompt: level === 2 ? 'Rechne. Zerlegen hilft.' : 'Rechne schriftlich oder zerlege.',
    expr: `${fmt(a)} · ${b} = ?`, input: 'number', answer: a * b,
    hint: { text: `Zerlege ${a}: ${parts.map((x) => `${x} · ${b}`).join(' und ')}. Dann zähle zusammen.` },
    solution: `${parts.map((x) => fmt(x * b)).join(' + ')} = ${fmt(a * b)}`,
  };
};

const teilen = (level, r) => {
  const d = int(r, 2, 9);
  if (level === 1) {
    const q = int(r, 2, 9) * pick(r, [10, 100]);
    const core = q % 100 === 0 ? q / 100 : q / 10;
    return {
      skill: 'g4_teilen', level, prompt: 'Rechne im Kopf.',
      expr: `${fmt(q * d)} : ${d} = ?`, input: 'number', answer: q,
      hint: { text: `Denk an die kleine Aufgabe: ${core * d} : ${d} = ${core}. Häng dann die Nullen wieder an.` },
      solution: `${fmt(q * d)} : ${d} = ${fmt(q)}`,
    };
  }
  const q = level === 2 ? int(r, 11, 29) : int(r, 101, 249);
  const n = q * d;
  const big = level === 2 ? Math.floor(q / 10) * 10 : Math.floor(q / 100) * 100;
  return {
    skill: 'g4_teilen', level, prompt: level === 2 ? 'Rechne. Zerlegen hilft.' : 'Rechne schriftlich oder zerlege.',
    expr: `${fmt(n)} : ${d} = ?`, input: 'number', answer: q,
    hint: { text: `Zerlege ${fmt(n)} in ${fmt(big * d)} und ${fmt(n - big * d)}. Teile beide Teile durch ${d} und zähle zusammen.` },
    solution: `${fmt(big * d)} : ${d} = ${big}, ${fmt(n - big * d)} : ${d} = ${q - big}, zusammen ${q}`,
  };
};

const rest = (level, r) => {
  const d = int(r, 3, 9);
  const q = level === 3 ? int(r, 11, 40) : int(r, 2, 9);
  const rem = int(r, 1, d - 1);
  const n = d * q + rem;
  const askQ = level === 2;
  return {
    skill: 'g4_rest', level, prompt: askQ ? 'Wie oft passt die Zahl hinein?' : 'Welcher Rest bleibt übrig?',
    expr: askQ ? `${n} : ${d} = ? Rest ${rem}` : `${n} : ${d} = ${q} Rest ?`, input: 'number', answer: askQ ? q : rem,
    hint: { text: `Such die größte Zahl aus der ${d}er-Reihe, die in ${n} passt: ${q} · ${d} = ${q * d}. Was fehlt bis ${n}?` },
    solution: `${n} : ${d} = ${q} Rest ${rem}, denn ${q} · ${d} = ${q * d} und ${q * d} + ${rem} = ${n}`,
  };
};

// ---------- Größen ----------

const UNITS = [['km', 'm', 1000], ['m', 'cm', 100], ['kg', 'g', 1000], ['t', 'kg', 1000], ['h', 'min', 60], ['min', 's', 60], ['€', 'ct', 100], ['l', 'ml', 1000]];

const groessen = (level, r) => {
  const base = { skill: 'g4_groessen', level, input: 'number' };
  if (level === 1) {
    const [big, small, f] = pick(r, UNITS);
    const k = int(r, 2, 9);
    const down = r() < 0.6;
    return {
      ...base, prompt: 'Wandle um.',
      expr: down ? `${k} ${big} = ? ${small}` : `${fmt(k * f)} ${small} = ? ${big}`, answer: down ? k * f : k,
      hint: { text: `1 ${big} = ${fmt(f)} ${small}` },
      solution: `${k} ${big} = ${fmt(k * f)} ${small}`,
    };
  }
  if (level === 2) {
    const [big, small, f] = pick(r, UNITS);
    const k = int(r, 1, 9), m = f === 60 ? int(r, 5, 55) : int(r, 1, 9) * (f / 20);
    return {
      ...base, prompt: 'Wandle um.',
      expr: `${k} ${big} ${m} ${small} = ? ${small}`, answer: k * f + m,
      hint: { text: `1 ${big} = ${fmt(f)} ${small}. Wandle zuerst ${k} ${big} um, dann zähle ${m} ${small} dazu.` },
      solution: `${fmt(k * f)} ${small} + ${m} ${small} = ${fmt(k * f + m)} ${small}`,
    };
  }
  const [big, small, f] = pick(r, UNITS.filter((u) => u[2] !== 60));
  const k = int(r, 0, 9), dec = until(() => pick(r, [5, 25, 75, 2, 4, 8]), (v) => (k > 0 || v > 0));
  const decStr = String(dec);
  const val = k * f + Math.round(Number(`0.${decStr}`) * f);
  return {
    ...base, prompt: 'Wandle um. Achte auf das Komma.',
    expr: `${k},${decStr} ${big} = ? ${small}`, answer: val,
    hint: { text: `1 ${big} = ${fmt(f)} ${small}. Also sind 0,${decStr} ${big} = ${fmt(val - k * f)} ${small}.` },
    solution: `${k},${decStr} ${big} = ${fmt(val)} ${small}`,
  };
};

// ---------- Sachaufgaben in zwei Schritten ----------

const SACH = [
  (L, r) => {
    const a = int(r, L === 1 ? 3 : 6, L === 1 ? 6 : 12), b = L === 3 ? int(r, 12, 25) : int(r, 4, 9);
    const c = int(r, 5, a * b - 3);
    return { text: `Im Lager stehen ${a} Kisten mit je ${b} Seilen. ${c} Seile werden für eine Brücke gebraucht. Wie viele Seile bleiben übrig?`, s1: `${a} · ${b} = ${a * b}`, s2: `${a * b} − ${c} = ${a * b - c}`, x: a * b - c, unit: 'Seile', first: `Wie viele Seile sind es insgesamt? Rechne ${a} · ${b}.` };
  },
  (L, r) => {
    const a = int(r, 4, L === 1 ? 9 : 18), b = int(r, 3, L === 3 ? 12 : 6), c = int(r, 2, 9);
    return { text: `Eine Eintrittskarte kostet ${a} €. Familie Berg kauft ${b} Karten und dazu einen Lageplan für ${c} €. Wie viel bezahlt sie?`, s1: `${b} · ${a} € = ${a * b} €`, s2: `${a * b} € + ${c} € = ${a * b + c} €`, x: a * b + c, unit: '€', first: `Was kosten die Karten? Rechne ${b} · ${a}.` };
  },
  (L, r) => {
    const c = int(r, 4, 8), boats = int(r, 3, L === 1 ? 6 : 12);
    const total = c * boats, a = int(r, 3, total - 3);
    return { text: `${a} Kinder und ${total - a} Erwachsene fahren mit Booten über den See. In jedes Boot passen ${c} Personen. Wie viele Boote werden voll?`, s1: `${a} + ${total - a} = ${total}`, s2: `${total} : ${c} = ${boats}`, x: boats, unit: 'Boote', first: `Wie viele Personen sind es zusammen? Rechne ${a} + ${total - a}.` };
  },
  (L, r) => {
    const a = L === 1 ? int(r, 20, 40) : int(r, 120, 480), b = int(r, 5, Math.floor(a / 3)), c = int(r, 4, Math.floor(a / 3));
    return { text: `Der Weg zur alten Stadt ist ${a} km lang. Am ersten Tag schafft die Gruppe ${b} km, am zweiten Tag ${c} km. Wie viele km fehlen noch?`, s1: `${b} + ${c} = ${b + c}`, s2: `${a} − ${b + c} = ${a - b - c}`, x: a - b - c, unit: 'km', first: `Wie weit ist die Gruppe schon gekommen? Rechne ${b} + ${c}.` };
  },
  (L, r) => {
    const a = int(r, L === 1 ? 5 : 12, L === 1 ? 9 : 25), b = int(r, 3, L === 3 ? 12 : 8), c = int(r, 4, 9) * 10;
    return { text: `Ein Futtersack wiegt ${a} kg. Auf dem Wagen liegen ${b} Säcke. Der leere Wagen wiegt ${c} kg. Wie schwer ist der beladene Wagen?`, s1: `${b} · ${a} kg = ${a * b} kg`, s2: `${a * b} kg + ${c} kg = ${a * b + c} kg`, x: a * b + c, unit: 'kg', first: `Wie schwer sind alle Säcke zusammen? Rechne ${b} · ${a}.` };
  },
];

const sach = (level, r) => {
  const t = pick(r, SACH)(level, r);
  return {
    skill: 'g4_sach', level, prompt: 'Rechne in zwei Schritten.', text: t.text,
    input: 'number', answer: t.x, unit: t.unit,
    hint: { text: `Erster Schritt: ${t.first}` },
    solution: `1. ${t.s1}  2. ${t.s2}`,
  };
};

export const SKILLS4 = [
  { id: 'g4_stellenwert', name: 'Stellenwerte bis 1 Million', grade: 4, gen: stellenwert },
  { id: 'g4_nachbar', name: 'Nachbarzahlen groß', grade: 4, gen: nachbar },
  { id: 'g4_ordnen', name: 'Große Zahlen vergleichen', grade: 4, gen: ordnen },
  { id: 'g4_runden', name: 'Runden', grade: 4, gen: runden },
  { id: 'g4_zahlenstrahl', name: 'Zahlenstrahl groß', grade: 4, gen: zahlenstrahl },
  { id: 'g4_plus', name: 'Plus mit großen Zahlen', grade: 4, gen: plusMinus('g4_plus', 1) },
  { id: 'g4_minus', name: 'Minus mit großen Zahlen', grade: 4, gen: plusMinus('g4_minus', -1) },
  { id: 'g4_ueberschlag', name: 'Überschlagen', grade: 4, gen: ueberschlag },
  { id: 'g4_mal', name: 'Malnehmen groß', grade: 4, gen: mal },
  { id: 'g4_teilen', name: 'Teilen groß', grade: 4, gen: teilen },
  { id: 'g4_rest', name: 'Teilen mit Rest', grade: 4, gen: rest },
  { id: 'g4_groessen', name: 'Größen umwandeln', grade: 4, gen: groessen },
  { id: 'g4_sach', name: 'Sachaufgaben in zwei Schritten', grade: 4, gen: sach },
];
