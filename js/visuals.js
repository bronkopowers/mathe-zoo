// Bilder zu den Aufgaben: Rechenstrich, Stellenwerttafel, Zahlenstrahl,
// Zahlenmauer, Punktefelder, Geld. Gibt HTML/SVG-Strings zurück.

const LIVE = '<span class="live-answer">?</span>';

export function renderVisual(v) {
  if (!v) return '';
  switch (v.type) {
    case 'jumps': return jumps(v);
    case 'blocks': return blocks(v);
    case 'placeTable': return placeTable(v.n);
    case 'line': return numberLine(v);
    case 'wall': return wall(v);
    case 'sequence': return sequence(v);
    case 'dots': return dots(v);
    case 'groups': return groups(v);
    case 'money': return money(v.ct);
    case 'terms': return terms();
    case 'column': return column(v);
    default: return '';
  }
}

function jumps({ start, steps }) {
  const n = steps.length;
  const W = 120 + n * 150, H = 130, y = 90;
  const xs = [40];
  for (let i = 0; i < n; i++) xs.push(40 + (i + 1) * 150);
  const vals = [start];
  steps.forEach((s) => vals.push(vals[vals.length - 1] + s));
  const neg = steps[0] < 0;
  let g = `<line x1="20" y1="${y}" x2="${W - 20}" y2="${y}" class="ln"/>`;
  // Bei Minus wird von rechts nach links gesprungen
  const pos = neg ? xs.slice().reverse() : xs;
  vals.forEach((v, i) => {
    g += `<line x1="${pos[i]}" y1="${y - 8}" x2="${pos[i]}" y2="${y + 8}" class="ln"/>`;
    g += `<text x="${pos[i]}" y="${y + 30}" class="lbl">${i === vals.length - 1 ? '?' : v}</text>`;
  });
  steps.forEach((s, i) => {
    const x1 = pos[i], x2 = pos[i + 1], mx = (x1 + x2) / 2;
    g += `<path d="M${x1},${y - 10} Q${mx},${y - 75} ${x2},${y - 10}" class="arc"/>`;
    g += `<text x="${mx}" y="${y - 50}" class="lbl jump">${s > 0 ? '+' : '−'}${Math.abs(s)}</text>`;
  });
  return `<svg class="vis" viewBox="0 0 ${W} ${H}" role="img" aria-label="Rechenstrich">${g}</svg>`;
}

function blocks({ h, z, e }) {
  const hund = Array.from({ length: h }, () => '<div class="b-h"></div>').join('');
  const zehn = Array.from({ length: z }, () => '<div class="b-z"></div>').join('');
  const eins = Array.from({ length: e }, () => '<div class="b-e"></div>').join('');
  return `<div class="vis blocks">
    <div class="b-col"><div class="b-grp">${hund || '<em>0</em>'}</div><div class="b-cap">H</div></div>
    <div class="b-col"><div class="b-grp z">${zehn || '<em>0</em>'}</div><div class="b-cap">Z</div></div>
    <div class="b-col"><div class="b-grp e">${eins || '<em>0</em>'}</div><div class="b-cap">E</div></div>
  </div>`;
}

function placeTable(n) {
  const d = String(n).padStart(3, '0').split('');
  const heads = ['M', 'HT', 'ZT', 'T', 'H', 'Z', 'E'].slice(-d.length);
  return `<table class="vis place"><tr>${heads.map((h) => `<th>${h}</th>`).join('')}</tr><tr>${d.map((x) => `<td>${x}</td>`).join('')}</tr></table>`;
}

// Schriftliches Rechnen: Zahlen stellengerecht untereinander
function column({ a, b, op }) {
  const w = Math.max(String(a).length, String(b).length) + 1;
  const row = (n, pre = '') => `<tr>${(pre + String(n).padStart(w - pre.length, ' ')).split('').map((c) => `<td>${c === ' ' ? '' : c}</td>`).join('')}</tr>`;
  return `<table class="vis column">${row(a)}${row(b, op)}<tr class="sum">${'<td></td>'.repeat(w - 1)}<td>?</td></tr></table>`;
}

function numberLine({ from, to, step, label, mark, arrow }) {
  const W = 680, pad = 30, y = 70;
  const ticks = Math.round((to - from) / step);
  const px = (v) => pad + ((v - from) / (to - from)) * (W - 2 * pad);
  let g = `<line x1="${pad - 10}" y1="${y}" x2="${W - pad + 10}" y2="${y}" class="ln"/>`;
  for (let i = 0; i <= ticks; i++) {
    const v = from + i * step;
    const big = v % label === 0;
    g += `<line x1="${px(v)}" y1="${y - (big ? 14 : 7)}" x2="${px(v)}" y2="${y + (big ? 14 : 7)}" class="ln${big ? '' : ' thin'}"/>`;
    if (big && v !== arrow) g += `<text x="${px(v)}" y="${y + 38}" class="lbl small">${v}</text>`;
  }
  if (mark !== undefined) g += `<circle cx="${px(mark)}" cy="${y}" r="9" class="mark"/><text x="${px(mark)}" y="${y - 22}" class="lbl small">${mark}</text>`;
  if (arrow !== undefined) g += `<path d="M${px(arrow)},${y - 12} l-11,-24 h22 z" class="arrow"/>`;
  return `<svg class="vis" viewBox="0 0 ${W} 120" role="img" aria-label="Zahlenstrahl">${g}</svg>`;
}

function wall({ bricks, show, ask }) {
  const cell = (key, val) => {
    if (key === ask) return `<div class="brick ask">${LIVE}</div>`;
    return `<div class="brick">${show.includes(key) ? val : ''}</div>`;
  };
  const { base, mid, top } = bricks;
  return `<div class="vis wall">
    <div class="row">${cell('top', top)}</div>
    <div class="row">${cell('mid0', mid[0])}${cell('mid1', mid[1])}</div>
    <div class="row">${cell('base0', base[0])}${cell('base1', base[1])}${cell('base2', base[2])}</div>
  </div>`;
}

function sequence({ items }) {
  return `<div class="vis seq">${items.map((v) => (v === null ? `<div class="egg ask">${LIVE}</div>` : `<div class="egg">${v}</div>`)).join('')}<div class="egg dots">…</div></div>`;
}

function dots({ rows, cols }) {
  let g = '';
  for (let r = 0; r < rows; r++) {
    g += `<div class="drow${r === 4 ? ' gap' : ''}">`;
    for (let c = 0; c < cols; c++) g += `<span class="dot${c === 4 ? ' gap' : ''}"></span>`;
    g += '</div>';
  }
  return `<div class="vis dots">${g}<div class="cap">${rows} Reihen mit je ${cols}</div></div>`;
}

function groups({ groups: n, each }) {
  let g = '';
  for (let i = 0; i < n; i++) g += `<div class="grp">${'<span class="dot"></span>'.repeat(each)}</div>`;
  return `<div class="vis groups">${g}</div>`;
}

const DENOMS = [2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
function money(ct) {
  let rest = ct;
  const parts = [];
  for (const d of DENOMS) {
    while (rest >= d && parts.length < 14) { parts.push(d); rest -= d; }
  }
  const label = (d) => (d >= 100 ? `${d / 100} €` : `${d} ct`);
  const cls = (d) => (d >= 500 ? 'note' : d >= 100 ? 'coin gold big' : d >= 10 ? 'coin gold' : 'coin copper');
  return `<div class="vis money">${parts.map((d) => `<span class="${cls(d)}">${label(d)}</span>`).join('')}</div>`;
}

function terms() {
  return `<table class="vis terms">
    <tr><td>345</td><td>+</td><td>23</td><td>=</td><td>368</td></tr>
    <tr class="t"><td>1. Summand</td><td></td><td>2. Summand</td><td></td><td>Summe</td></tr>
    <tr><td>368</td><td>−</td><td>23</td><td>=</td><td>345</td></tr>
    <tr class="t"><td>Minuend</td><td></td><td>Subtrahend</td><td></td><td>Differenz</td></tr>
  </table>`;
}
