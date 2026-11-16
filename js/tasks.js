// Aufgaben-Generatoren für Klasse 3 (Zahlenraum bis 1000).
// Jeder Generator: gen(level 1..3, rng) -> Aufgabe.
// Reine Funktionen, keine DOM-Abhängigkeit (testbar mit node --test).

export const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export const shuffle = (r, arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const digit = (n, p) => Math.floor(n / p) % 10;
const hund = (n) => Math.floor(n / 100);

function until(make, ok, max = 2000) {
  for (let i = 0; i < max; i++) {
    const v = make();
    if (ok(v)) return v;
  }
  throw new Error('Generator hat keine passende Aufgabe gefunden');
}

export const euro = (ct) => {
  const e = Math.floor(ct / 100);
  const c = String(ct % 100).padStart(2, '0');
  return `${e},${c} €`;
};

// Zerlegt b in Rechenschritte (Hunderter, dann bis zum vollen Hunderter / Zehner, dann Rest)
export function jumpSteps(start, b, sign, toHundred) {
  const steps = [];
  let cur = start;
  let rem = b;
  const h = Math.floor(rem / 100) * 100;
  if (h) { steps.push(h); cur += sign * h; rem -= h; }
  if (toHundred && rem) {
    const k = sign > 0 ? (100 - (cur % 100)) % 100 : cur % 100;
    if (k && k < rem) { steps.push(k); cur += sign * k; rem -= k; }
  } else {
    const t = Math.floor(rem / 10) * 10;
    if (t && t !== rem) { steps.push(t); cur += sign * t; rem -= t; }
  }
  void cur;
  if (rem) steps.push(rem);
  return steps;
}

function addSubTask(skill, level, a, b, sign, toHundred) {
  const op = sign > 0 ? '+' : '−';
  const res = a + sign * b;
  // Über den vollen Hunderter nur bei reinen Zehnern (375 + 40), sonst stellenweise (H, Z, E)
  const steps = jumpSteps(a, b, sign, toHundred && b < 100 && b % 10 === 0);
  const chain = steps.length > 1 ? `${a} ${op} ${steps.join(` ${op} `)} = ${res}` : `${a} ${op} ${b} = ${res}`;
  return {
    skill, level,
    prompt: 'Rechne.',
    expr: `${a} ${op} ${b} = ?`,
    input: 'number',
    answer: res,
    hint: {
      text: steps.length > 1
        ? `Rechne in Schritten: erst ${op} ${steps[0]}, dann ${op} ${steps.slice(1).join(` und ${op} `)}.`
        : `Schau genau auf die Stelle, die sich ändert.`,
      visual: { type: 'jumps', start: a, steps: steps.map((s) => sign * s) },
    },
    solution: chain,
  };
}

// ---------- Zahlenraum ----------

const stellenwert = (level, r) => {
  const mode = int(r, 0, 1);
  if (level === 3) {
    if (mode === 0) {
      const h = int(r, 1, 7), z = int(r, 10, 19), e = int(r, 0, 9);
      const n = h * 100 + z * 10 + e;
      return {
        skill: 'stellenwert', level, prompt: 'Welche Zahl ist das? Achtung, bündeln!',
        expr: `${h} H  ${z} Z  ${e} E = ?`, input: 'number', answer: n,
        hint: { text: `10 Zehner sind 1 Hunderter. ${z} Z = 1 H und ${z - 10} Z.`, visual: { type: 'blocks', h, z, e } },
        solution: `${h} H + ${z} Z + ${e} E = ${h * 100} + ${z * 10} + ${e} = ${n}`,
      };
    }
    const n = int(r, 11, 99) * 10;
    return {
      skill: 'stellenwert', level, prompt: 'Wie viele Zehner hat die Zahl insgesamt?',
      expr: `${n} hat ? Zehner`, input: 'number', answer: n / 10,
      hint: { text: `Jeder Hunderter hat 10 Zehner. ${hund(n)} H = ${hund(n) * 10} Z.`, visual: { type: 'blocks', h: hund(n), z: digit(n, 10), e: 0 } },
      solution: `${n} = ${n / 10} Zehner`,
    };
  }
  const n = until(() => int(r, 101, 999), (v) => level === 2 ? (digit(v, 10) === 0 || digit(v, 1) === 0) : (digit(v, 10) > 0 && digit(v, 1) > 0));
  const h = hund(n), z = digit(n, 10), e = digit(n, 1);
  if (mode === 0) {
    return {
      skill: 'stellenwert', level, prompt: 'Welche Zahl ist das?',
      expr: `${h} H  ${z} Z  ${e} E = ?`, input: 'number', answer: n,
      visual: { type: 'blocks', h, z, e },
      hint: { text: 'Hunderter vorne, dann Zehner, dann Einer. Eine 0 hält den Platz frei!', visual: { type: 'placeTable', n } },
      solution: `${h} H ${z} Z ${e} E = ${n}`,
    };
  }
  const which = pick(r, [['Hunderter', h], ['Zehner', z], ['Einer', e]]);
  return {
    skill: 'stellenwert', level, prompt: `Wie viele ${which[0]} hat die Zahl?`,
    expr: `${n}`, input: 'number', answer: which[1],
    hint: { text: 'Schreib die Zahl in die Stellenwerttafel.', visual: { type: 'placeTable', n } },
    solution: `${n}: ${h} H, ${z} Z, ${e} E → ${which[0]}: ${which[1]}`,
  };
};

const nachbarzahlen = (level, r) => {
  if (level === 1) {
    const n = int(r, 101, 998);
    const before = r() < 0.5;
    return {
      skill: 'nachbarzahlen', level, prompt: before ? 'Welche Zahl kommt direkt davor? (Vorgänger)' : 'Welche Zahl kommt direkt danach? (Nachfolger)',
      expr: before ? `? ← ${n}` : `${n} → ?`, input: 'number', answer: before ? n - 1 : n + 1,
      hint: { text: before ? 'Der Vorgänger ist 1 weniger.' : 'Der Nachfolger ist 1 mehr.', visual: { type: 'line', from: n - 5, to: n + 5, step: 1, label: 5, mark: n } },
      solution: before ? `${n} − 1 = ${n - 1}` : `${n} + 1 = ${n + 1}`,
    };
  }
  if (level === 2) {
    const n = until(() => int(r, 101, 989), (v) => v % 10 !== 0);
    const lower = r() < 0.5;
    const ans = lower ? n - (n % 10) : n - (n % 10) + 10;
    return {
      skill: 'nachbarzahlen', level, prompt: lower ? 'Welcher Zehner kommt vor der Zahl? (Nachbarzehner)' : 'Welcher Zehner kommt nach der Zahl? (Nachbarzehner)',
      expr: lower ? `? < ${n}` : `${n} < ?`, input: 'number', answer: ans,
      hint: { text: 'Nachbarzehner enden auf 0.', visual: { type: 'line', from: n - (n % 10), to: n - (n % 10) + 10, step: 1, label: 5, mark: n } },
      solution: `${n - (n % 10)} < ${n} < ${n - (n % 10) + 10}`,
    };
  }
  const n = until(() => int(r, 101, 899), (v) => v % 100 !== 0);
  const lower = r() < 0.5;
  const ans = lower ? hund(n) * 100 : hund(n) * 100 + 100;
  return {
    skill: 'nachbarzahlen', level, prompt: lower ? 'Welcher Hunderter kommt vor der Zahl? (Nachbarhunderter)' : 'Welcher Hunderter kommt nach der Zahl? (Nachbarhunderter)',
    expr: lower ? `? < ${n}` : `${n} < ?`, input: 'number', answer: ans,
    hint: { text: 'Nachbarhunderter enden auf 00.', visual: { type: 'line', from: hund(n) * 100, to: hund(n) * 100 + 100, step: 10, label: 50, mark: n } },
    solution: `${hund(n) * 100} < ${n} < ${hund(n) * 100 + 100}`,
  };
};

const CMP = [{ label: '<', value: '<' }, { label: '=', value: '=' }, { label: '>', value: '>' }];
const cmp = (a, b) => (a < b ? '<' : a > b ? '>' : '=');

const ordnen = (level, r) => {
  if (level === 3) {
    const a = int(r, 1, 8) * 100, b = int(r, 10, 99);
    const c = r() < 0.25 ? a + b : a + b + pick(r, [-10, -1, 1, 10, 100, -100]);
    return {
      skill: 'ordnen', level, prompt: 'Setze das richtige Zeichen ein.',
      expr: `${a} + ${b}  ○  ${c}`, input: 'choice', choices: CMP, answer: cmp(a + b, c),
      hint: { text: `Rechne zuerst links aus: ${a} + ${b} = ?. Dann vergleiche.` },
      solution: `${a} + ${b} = ${a + b}, also ${a + b} ${cmp(a + b, c)} ${c}`,
    };
  }
  const a = int(r, 100, 999);
  const b = level === 1
    ? until(() => int(r, 100, 999), (v) => hund(v) !== hund(a))
    : until(() => hund(a) * 100 + int(r, 0, 99), (v) => v !== a || r() < 0.15);
  return {
    skill: 'ordnen', level, prompt: 'Setze das richtige Zeichen ein.',
    expr: `${a}  ○  ${b}`, input: 'choice', choices: CMP, answer: cmp(a, b),
    hint: { text: 'Vergleiche zuerst die Hunderter. Sind sie gleich, dann die Zehner, dann die Einer. Das Krokodil-Maul frisst die größere Zahl.' },
    solution: `${a} ${cmp(a, b)} ${b}`,
  };
};

const zahlenstrahl = (level, r) => {
  let from, to, step, label, n;
  if (level === 1) { from = 0; to = 1000; step = 50; label = 100; n = int(r, 1, 19) * 50; }
  else if (level === 2) { from = int(r, 0, 9) * 100; to = from + 100; step = 10; label = 50; n = from + int(r, 1, 9) * 10; }
  else { from = int(r, 10, 98) * 10; to = from + 20; step = 1; label = 5; n = from + until(() => int(r, 1, 19), (v) => v % 5 !== 0); }
  return {
    skill: 'zahlenstrahl', level, prompt: 'Welche Zahl zeigt der Pfeil?',
    visual: { type: 'line', from, to, step, label, arrow: n },
    input: 'number', answer: n,
    hint: { text: `Von Strich zu Strich sind es immer ${step}. Zähle vom nächsten beschrifteten Strich aus.` },
    solution: `Der Pfeil zeigt auf ${n}.`,
  };
};

// ---------- Plus / Minus ----------

const plusOhne = (level, r) => {
  let a, b;
  if (level === 1) {
    a = int(r, 101, 899);
    const p = pick(r, [1, 10, 100]);
    const room = 9 - digit(a, p);
    if (room === 0) return plusOhne(level, r);
    b = int(r, 1, room) * p;
  } else if (level === 2) {
    [a, b] = until(() => [int(r, 101, 899), int(r, 11, 89)], ([x, y]) => (x % 100) + y < 100);
  } else {
    [a, b] = until(() => [int(r, 101, 799), int(r, 101, 799)], ([x, y]) => x + y < 1000 && (x % 100) + (y % 100) < 100);
  }
  return addSubTask('plus_ohne', level, a, b, 1, false);
};

const minusOhne = (level, r) => {
  let a, b;
  if (level === 1) {
    a = int(r, 111, 999);
    const p = pick(r, [1, 10, 100]);
    const room = digit(a, p);
    if (room === 0) return minusOhne(level, r);
    b = int(r, 1, room) * p;
  } else if (level === 2) {
    [a, b] = until(() => [int(r, 120, 999), int(r, 11, 89)], ([x, y]) => (x % 100) >= y);
  } else {
    [a, b] = until(() => [int(r, 300, 999), int(r, 101, 799)], ([x, y]) => x > y && (x % 100) >= (y % 100));
  }
  return addSubTask('minus_ohne', level, a, b, -1, false);
};

const plusMit = (level, r) => {
  let a, b;
  if (level === 1) {
    [a, b] = until(() => [int(r, 10, 89) * 10 + int(r, 0, 9), int(r, 1, 9) * 10], ([x, y]) => (x % 100) + y >= 100 && x + y < 1000);
  } else if (level === 2) {
    [a, b] = until(() => [int(r, 101, 899), int(r, 11, 99)], ([x, y]) => (x % 100) + y >= 100 && x + y < 1000 && (x + y) % 100 !== 0);
  } else {
    [a, b] = until(() => [int(r, 101, 699), int(r, 101, 499)], ([x, y]) => (x % 100) + (y % 100) >= 100 && x + y < 1000);
  }
  return addSubTask('plus_mit', level, a, b, 1, true);
};

const minusMit = (level, r) => {
  let a, b;
  if (level === 1) {
    [a, b] = until(() => [int(r, 10, 99) * 10 + int(r, 0, 9), int(r, 1, 9) * 10], ([x, y]) => (x % 100) < y && x - y > 0);
  } else if (level === 2) {
    [a, b] = until(() => [int(r, 101, 999), int(r, 11, 99)], ([x, y]) => (x % 100) < y && x - y > 0);
  } else {
    [a, b] = until(() => [int(r, 301, 999), int(r, 101, 599)], ([x, y]) => (x % 100) < (y % 100) && x - y > 0);
  }
  return addSubTask('minus_mit', level, a, b, -1, true);
};

const zahlenmauer = (level, r) => {
  const [a, b, c] = until(
    () => (level === 1 ? [int(r, 5, 99), int(r, 5, 99), int(r, 5, 99)] : [int(r, 10, 400), int(r, 10, 300), int(r, 10, 400)]),
    ([x, y, z]) => x + 2 * y + z <= 1000,
  );
  const bricks = { base: [a, b, c], mid: [a + b, b + c], top: a + 2 * b + c };
  // show: welche Steine sichtbar sind; ask: welcher Stein gesucht ist
  let show, ask, answer, hintText;
  if (level === 1) {
    const which = pick(r, ['mid0', 'mid1', 'top']);
    show = which === 'top' ? ['base0', 'base1', 'base2', 'mid0', 'mid1'] : ['base0', 'base1', 'base2', which === 'mid0' ? 'mid1' : 'mid0'];
    ask = which;
    answer = which === 'top' ? bricks.top : which === 'mid0' ? a + b : b + c;
    hintText = 'Zwei Steine nebeneinander werden zusammengezählt. Das Ergebnis steht im Stein darüber.';
  } else if (level === 2) {
    const which = pick(r, ['base0', 'base2']);
    show = which === 'base0' ? ['base1', 'base2', 'mid0', 'mid1', 'top'] : ['base0', 'base1', 'mid0', 'mid1', 'top'];
    ask = which;
    answer = which === 'base0' ? a : c;
    hintText = which === 'base0'
      ? `Welche Zahl plus ${b} ergibt ${a + b}? Rechne ${a + b} − ${b}.`
      : `${b} plus welche Zahl ergibt ${b + c}? Rechne ${b + c} − ${b}.`;
  } else {
    show = ['base0', 'mid1', 'top'];
    ask = 'base1';
    answer = b;
    hintText = `Zuerst den linken mittleren Stein: ${bricks.top} − ${b + c}. Dann davon ${a} abziehen.`;
  }
  return {
    skill: 'zahlenmauer', level, prompt: 'Welche Zahl gehört in den gelben Stein?',
    visual: { type: 'wall', bricks, show, ask },
    input: 'number', answer,
    hint: { text: hintText },
    solution: `Unten: ${a}, ${b}, ${c} · Mitte: ${a + b}, ${b + c} · Oben: ${bricks.top}`,
  };
};

const zahlenfolgen = (level, r) => {
  let rule, start, seq;
  const build = (s, ops, len) => {
    const out = [s];
    for (let i = 1; i < len; i++) out.push(out[i - 1] + ops[(i - 1) % ops.length]);
    return out;
  };
  if (level === 1) {
    const d = pick(r, [2, 5, 10, 20, 25, 50, 100]) * pick(r, [1, -1]);
    rule = [d];
  } else {
    const up = int(r, 3, 40), down = int(r, 2, 30);
    rule = r() < 0.5 ? [up, -down] : [-down, up];
  }
  [start, seq] = until(
    () => { const s = int(r, 100, 900); return [s, build(s, rule, 7)]; },
    ([, q]) => q.every((v) => v >= 0 && v <= 1000),
  );
  const fmt = (d) => (d > 0 ? `+ ${d}` : `− ${-d}`);
  const ruleText = rule.map(fmt).join(', ');
  const askIdx = level === 3 ? 5 : int(r, 2, 5);
  const shown = seq.map((v, i) => (i === askIdx ? null : (level === 3 && i > 5 ? undefined : v)));
  return {
    skill: 'zahlenfolgen', level,
    prompt: level === 3 ? 'Finde die Regel. Welche Zahl fehlt?' : `Immer ${ruleText}. Welche Zahl fehlt?`,
    visual: { type: 'sequence', items: shown.filter((v) => v !== undefined) },
    input: 'number', answer: seq[askIdx],
    hint: { text: level === 3 ? `Schau, wie sich die Zahlen von einer zur nächsten ändern. Die Regel ist: immer ${ruleText}.` : `Gehe Schritt für Schritt vom letzten bekannten Ei aus.` },
    solution: `Regel: immer ${ruleText} → ${seq.join(', ')}`,
  };
};

const fachbegriffe = (level, r) => {
  const big = level === 1 ? 300 : 900;
  const forms = level === 1 ? ['summe', 'differenz'] : level === 2 ? ['summe', 'differenz', 'summand2', 'subtrahend'] : ['summand2', 'subtrahend', 'minuend', 'summand1'];
  const f = pick(r, forms);
  const x = int(r, 100, big), y = int(r, 10, 99);
  const merk = 'Summand + Summand = Summe. Minuend − Subtrahend = Differenz.';
  const T = {
    summe: [`Der 1. Summand ist ${x}. Der 2. Summand ist ${y}.`, 'Wie heißt die Summe?', x + y, `${x} + ${y} = ${x + y}`],
    differenz: [`Der Minuend ist ${x}. Der Subtrahend ist ${y}.`, 'Wie heißt die Differenz?', x - y, `${x} − ${y} = ${x - y}`],
    summand2: [`Der 1. Summand ist ${x}. Die Summe heißt ${x + y}.`, 'Wie heißt der 2. Summand?', y, `${x} + ${y} = ${x + y}`],
    subtrahend: [`Der Minuend ist ${x}. Die Differenz heißt ${x - y}.`, 'Wie heißt der Subtrahend?', y, `${x} − ${y} = ${x - y}`],
    minuend: [`Der Subtrahend ist ${y}. Die Differenz heißt ${x - y}.`, 'Wie heißt der Minuend?', x, `${x} − ${y} = ${x - y}`],
    summand1: [`Der 2. Summand ist ${y}. Die Summe heißt ${x + y}.`, 'Wie heißt der 1. Summand?', x, `${x} + ${y} = ${x + y}`],
  }[f];
  return {
    skill: 'fachbegriffe', level, prompt: T[1], text: T[0],
    input: 'number', answer: T[2],
    hint: { text: merk, visual: { type: 'terms' } },
    solution: T[3],
  };
};

// ---------- Mal / Geteilt ----------

const ROWS = { 1: [1, 2, 5, 10], 2: [3, 4, 6], 3: [7, 8, 9] };

const einmaleins = (level, r) => {
  const row = level === 3 && r() < 0.3 ? pick(r, [3, 4, 6, 7, 8, 9]) : pick(r, ROWS[level]);
  const k = int(r, 1, 10);
  const missing = level >= 2 && r() < 0.25;
  const left = r() < 0.5;
  const [a, b] = left ? [k, row] : [row, k];
  if (missing) {
    return {
      skill: 'einmaleins', level, prompt: 'Welche Zahl fehlt?',
      expr: `? · ${b} = ${a * b}`, input: 'number', answer: a,
      hint: { text: `Wie oft passt ${b} in ${a * b}? Zähle in ${b}er-Schritten.`, visual: { type: 'dots', rows: a, cols: b } },
      solution: `${a} · ${b} = ${a * b}`,
    };
  }
  return {
    skill: 'einmaleins', level, prompt: 'Rechne.',
    expr: `${a} · ${b} = ?`, input: 'number', answer: a * b,
    hint: {
      text: a > 5 && a !== 10 ? `Nutze eine leichte Aufgabe: 5 · ${b} = ${5 * b}, dann noch ${a - 5} · ${b} dazu.` : `${a} Reihen mit je ${b} Punkten.`,
      visual: { type: 'dots', rows: a, cols: b },
    },
    solution: `${a} · ${b} = ${a * b}`,
  };
};

const teilen = (level, r) => {
  const d = level === 3 && r() < 0.3 ? pick(r, [3, 4, 6, 7, 8, 9]) : pick(r, ROWS[level]);
  const q = int(r, 1, 10);
  const n = d * q;
  return {
    skill: 'teilen', level, prompt: `Teile ${n} in ${d} gleich große Gruppen. Wie viele sind in jeder Gruppe?`,
    expr: `${n} : ${d} = ?`, input: 'number', answer: q,
    hint: { text: `Denk an die Malaufgabe: ? · ${d} = ${n}.`, visual: { type: 'groups', groups: d, each: q } },
    solution: `${n} : ${d} = ${q}, denn ${q} · ${d} = ${n}`,
  };
};

// ---------- Geld ----------

const geldUmrechnen = (level, r) => {
  const toCt = r() < 0.5;
  let ct;
  if (level === 1) ct = int(r, 1, 20) * 100;
  else if (level === 2) ct = int(r, 101, 999);
  else ct = until(() => int(r, 1001, 9999), (v) => v % 100 !== 0);
  if (toCt) {
    return {
      skill: 'geld_umrechnen', level, prompt: 'Wie viel Cent sind das?',
      expr: `${euro(ct)} = ? ct`, input: 'number', answer: ct,
      hint: { text: '1 € = 100 ct. Die Euro werden zu Hunderten, die Cent hängen hinten dran.', visual: { type: 'money', ct } },
      solution: `${euro(ct)} = ${ct} ct`,
    };
  }
  return {
    skill: 'geld_umrechnen', level, prompt: 'Wie viel Euro sind das?',
    expr: `${ct} ct = ? €`, input: 'money', answer: ct,
    hint: { text: '100 ct = 1 €. Die letzten zwei Ziffern sind die Cent, nach dem Komma.', visual: { type: 'money', ct } },
    solution: `${ct} ct = ${euro(ct)}`,
  };
};

const ITEMS = [['Eis', 120, 250], ['Saft', 80, 190], ['Brezel', 60, 150], ['Futtertüte', 100, 300], ['Postkarte', 50, 120], ['Kuscheltier', 450, 1290], ['Zoo-Poster', 250, 690], ['Eintritt Kind', 600, 900]];

const geldRechnen = (level, r) => {
  const [i1, i2] = shuffle(r, ITEMS);
  const price = (it) => (level === 1 ? Math.round(int(r, it[1], it[2]) / 100) * 100 || 100 : Math.round(int(r, it[1], it[2]) / 10) * 10);
  if (level === 2 && r() < 0.5) {
    const p = price(i1);
    const pay = until(() => pick(r, [500, 1000, 2000]), (v) => v > p);
    return {
      skill: 'geld_rechnen', level, prompt: `${i1[0]} kostet ${euro(p)}. Du bezahlst mit ${euro(pay)}. Wie viel Rückgeld bekommst du?`,
      expr: `${euro(pay)} − ${euro(p)} = ?`, input: 'money', answer: pay - p,
      hint: { text: 'Ergänze vom Preis bis zum bezahlten Betrag: erst zum nächsten vollen Euro, dann weiter.', visual: { type: 'money', ct: pay - p } },
      solution: `${euro(pay)} − ${euro(p)} = ${euro(pay - p)}`,
    };
  }
  if (level === 3 && r() < 0.5) {
    const p = price(i1), k = int(r, 2, 5);
    return {
      skill: 'geld_rechnen', level, prompt: `Ein ${i1[0]} kostet ${euro(p)}. Wie viel kosten ${k} Stück?`,
      expr: `${k} · ${euro(p)} = ?`, input: 'money', answer: k * p,
      hint: { text: `Rechne in Cent: ${k} · ${p} ct. Dann wieder in Euro umwandeln.` },
      solution: `${k} · ${p} ct = ${k * p} ct = ${euro(k * p)}`,
    };
  }
  const p1 = price(i1), p2 = price(i2);
  return {
    skill: 'geld_rechnen', level, prompt: `${i1[0]} kostet ${euro(p1)}, ${i2[0]} kostet ${euro(p2)}. Wie viel kostet beides zusammen?`,
    expr: `${euro(p1)} + ${euro(p2)} = ?`, input: 'money', answer: p1 + p2,
    hint: { text: 'Erst die Euro zusammenzählen, dann die Cent. 100 ct sind 1 €.' },
    solution: `${euro(p1)} + ${euro(p2)} = ${euro(p1 + p2)}`,
  };
};

// ---------- Sachaufgaben (schema-basiert) ----------

export const SCHEMAS = {
  dazu: { icon: '➕', label: 'Es kommt etwas dazu oder wird zusammengezählt', op: '+' },
  weg: { icon: '➖', label: 'Es wird etwas weggenommen', op: '−' },
  vergleich: { icon: '↔️', label: 'Zwei Mengen werden verglichen', op: '−' },
  mal: { icon: '✖️', label: 'Gleich große Gruppen', op: '·' },
  teilen: { icon: '➗', label: 'Etwas wird gerecht aufgeteilt', op: ':' },
};

// Platzhalter {a} und {b} werden zu antippbaren Zahlen
const SACH = [
  { s: 'dazu', t: 'Im Zoo leben {a} Flamingos. Heute kommen {b} neue Flamingos dazu. Wie viele Flamingos sind es jetzt?', u: 'Flamingos', ans: 'Jetzt sind es {x} Flamingos.' },
  { s: 'dazu', t: 'Am Vormittag besuchen {a} Kinder den Zoo, am Nachmittag {b} Kinder. Wie viele Kinder waren es zusammen?', u: 'Kinder', ans: 'Es waren {x} Kinder.' },
  { s: 'dazu', t: 'Der Elefant frisst morgens {a} kg Heu und abends {b} kg Heu. Wie viel Heu frisst er insgesamt?', u: 'kg', ans: 'Er frisst {x} kg Heu.' },
  { s: 'weg', t: 'Die Affen haben {a} Bananen. Sie fressen {b} Bananen. Wie viele Bananen sind noch übrig?', u: 'Bananen', ans: 'Es sind noch {x} Bananen übrig.' },
  { s: 'weg', t: 'Im Aquarium schwimmen {a} Fische. {b} Fische kommen in ein anderes Becken. Wie viele Fische bleiben?', u: 'Fische', ans: 'Es bleiben {x} Fische.' },
  { s: 'weg', t: 'Der Zoo hat {a} Eintrittskarten. {b} Karten sind schon verkauft. Wie viele Karten gibt es noch?', u: 'Karten', ans: 'Es gibt noch {x} Karten.' },
  { s: 'vergleich', t: 'Die Giraffe ist {a} cm groß. Das Zebra ist {b} cm groß. Wie viel cm ist die Giraffe größer?', u: 'cm', ans: 'Die Giraffe ist {x} cm größer.' },
  { s: 'vergleich', t: 'Lina hat {a} Tierkarten gesammelt. Tom hat {b} Tierkarten. Wie viele Karten hat Lina mehr?', u: 'Karten', ans: 'Lina hat {x} Karten mehr.' },
  { s: 'mal', t: 'Es gibt {a} Gehege. In jedem Gehege leben {b} Pinguine. Wie viele Pinguine sind es?', u: 'Pinguine', ans: 'Es sind {x} Pinguine.' },
  { s: 'mal', t: 'Der Tierpfleger bringt {a} Kisten. In jeder Kiste sind {b} Äpfel. Wie viele Äpfel sind es?', u: 'Äpfel', ans: 'Es sind {x} Äpfel.' },
  { s: 'teilen', t: '{a} Fische werden gerecht an {b} Seehunde verteilt. Wie viele Fische bekommt jeder Seehund?', u: 'Fische', ans: 'Jeder Seehund bekommt {x} Fische.' },
  { s: 'teilen', t: '{a} Kinder werden in Gruppen mit je {b} Kindern eingeteilt. Wie viele Gruppen gibt es?', u: 'Gruppen', ans: 'Es gibt {x} Gruppen.' },
];

const DISTRACTORS = [
  'Der Zoo ist seit {d} Jahren geöffnet.',
  'Der Tierpfleger arbeitet schon {d} Tage im Zoo.',
  'Der Parkplatz hat {d} Plätze.',
  'Im Zoo-Café gibt es {d} Stühle.',
];

function sachNumbers(schema, level, r) {
  const max = level === 1 ? 100 : 1000;
  switch (schema) {
    case 'dazu': return until(() => [int(r, 12, max * 0.6), int(r, 5, max * 0.4)], ([a, b]) => a + b <= max);
    case 'weg':
    case 'vergleich': return until(() => [int(r, 20, max - 1), int(r, 5, max - 10)], ([a, b]) => a > b);
    case 'mal': { const a = int(r, 2, 9), b = int(r, 2, 10); return [a, b]; }
    case 'teilen': { const b = int(r, 2, 9), q = int(r, 2, 10); return [b * q, b]; }
    default: throw new Error(schema);
  }
}

const calc = (s, a, b) => ({ dazu: a + b, weg: a - b, vergleich: a - b, mal: a * b, teilen: a / b })[s];

function tokenize(text, vals) {
  // zerlegt Text in [{text}|{num, role}]
  const out = [];
  const re = /\{(a|b|d)\}/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ num: vals[m[1]], role: m[1] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

const sachaufgaben = (level, r) => {
  const pool = level === 1 ? SACH.filter((x) => ['dazu', 'weg', 'vergleich'].includes(x.s)) : SACH;
  const tpl = pick(r, pool);
  const [a, b] = sachNumbers(tpl.s, level, r);
  const x = calc(tpl.s, a, b);
  let text = tpl.t;
  let d = null;
  if (level === 3) {
    d = until(() => int(r, 3, 120), (v) => v !== a && v !== b && v !== x);
    const dis = pick(r, DISTRACTORS);
    // Ablenker vor die Frage setzen (nach dem ersten Satz)
    const firstDot = text.indexOf('. ') + 2;
    text = text.slice(0, firstDot) + dis + ' ' + text.slice(firstDot);
  }
  const schemaChoices = (level === 1 ? ['dazu', 'weg', 'vergleich'] : Object.keys(SCHEMAS)).map((k) => ({ label: `${SCHEMAS[k].icon} ${SCHEMAS[k].label}`, value: k }));
  return {
    skill: 'sachaufgaben', level,
    prompt: 'Lies die Geschichte genau.',
    input: 'number', answer: x, unit: tpl.u,
    sach: {
      tokens: tokenize(text.replace(/\{d\}/, '{d}'), { a, b, d }),
      schema: tpl.s,
      needed: [a, b],
      distractor: d,
      schemaChoices,
      answerSentence: tpl.ans.replace('{x}', x),
    },
    hint: { text: `Tipp: ${SCHEMAS[tpl.s].icon} ${SCHEMAS[tpl.s].label}. Rechne ${a} ${SCHEMAS[tpl.s].op} ${b}.` },
    solution: `${a} ${SCHEMAS[tpl.s].op} ${b} = ${x}. ${tpl.ans.replace('{x}', x)}`,
  };
};

// ---------- Katalog ----------

export const SKILLS = [
  { id: 'stellenwert', name: 'Hunderter, Zehner, Einer', group: 'zahlenraum', gen: stellenwert },
  { id: 'nachbarzahlen', name: 'Nachbarzahlen', group: 'zahlenraum', gen: nachbarzahlen },
  { id: 'ordnen', name: 'Zahlen vergleichen', group: 'zahlenraum', gen: ordnen },
  { id: 'zahlenstrahl', name: 'Zahlenstrahl', group: 'zahlenraum', gen: zahlenstrahl },
  { id: 'plus_ohne', name: 'Plus ohne Hunderterübergang', group: 'plusminus', gen: plusOhne },
  { id: 'minus_ohne', name: 'Minus ohne Hunderterübergang', group: 'plusminus', gen: minusOhne },
  { id: 'plus_mit', name: 'Plus mit Hunderterübergang', group: 'plusminus', gen: plusMit },
  { id: 'minus_mit', name: 'Minus mit Hunderterübergang', group: 'plusminus', gen: minusMit },
  { id: 'zahlenmauer', name: 'Zahlenmauern', group: 'knobeln', gen: zahlenmauer },
  { id: 'zahlenfolgen', name: 'Zahlenfolgen', group: 'knobeln', gen: zahlenfolgen },
  { id: 'fachbegriffe', name: 'Summe, Differenz & Co.', group: 'knobeln', gen: fachbegriffe },
  { id: 'einmaleins', name: 'Einmaleins', group: 'malteilen', gen: einmaleins },
  { id: 'teilen', name: 'Teilen', group: 'malteilen', gen: teilen },
  { id: 'geld_umrechnen', name: 'Euro und Cent', group: 'geld', gen: geldUmrechnen },
  { id: 'geld_rechnen', name: 'Mit Geld rechnen', group: 'geld', gen: geldRechnen },
  { id: 'sachaufgaben', name: 'Sachaufgaben', group: 'sach', gen: sachaufgaben },
];

export const GROUPS = {
  zahlenraum: 'Zahlenraum bis 1000',
  plusminus: 'Plus & Minus',
  knobeln: 'Mauern, Folgen, Begriffe',
  malteilen: 'Mal & Geteilt',
  geld: 'Geld',
  sach: 'Sachaufgaben',
};

export const skillById = (id) => SKILLS.find((s) => s.id === id);

export function generate(skillId, level, r = Math.random) {
  const s = skillById(skillId);
  if (!s) throw new Error(`Unbekannte Fähigkeit: ${skillId}`);
  return s.gen(Math.max(1, Math.min(3, level)), r);
}

// Eingabe prüfen. Geld wird als Cent verglichen ("3,5" = 350 ct, "3" = 300 ct).
export function parseMoney(str) {
  const s = String(str).trim().replace('.', ',');
  if (!/^\d+(,\d{0,2})?$/.test(s)) return NaN;
  const [e, c = ''] = s.split(',');
  return Number(e) * 100 + Number((c + '00').slice(0, 2));
}

export function check(task, given) {
  if (task.input === 'choice') return given === task.answer;
  if (task.input === 'order') return Array.isArray(given) && given.length === task.answer.length && given.every((v, i) => v === task.answer[i]);
  if (task.input === 'coins' || task.input === 'tapline') return given !== null && given !== '' && Number(given) === task.answer;
  if (task.input === 'money') return parseMoney(given) === task.answer;
  return String(given).trim() !== '' && Number(given) === task.answer;
}
