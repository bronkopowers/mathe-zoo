// Handgezeichnete Szenen als SVG. Jede Szene reagiert auf den Fortschritt einer Runde:
// CSS-Variable --p (0..1) und die Klassen p1..p4 am <svg> bewegen die Mechanik.

const A = 'class="art" filter="url(#wob2)"';
const AW = 'class="art" filter="url(#wob)"';

export const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="wob" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter>
  <filter id="wob2" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3"/></filter>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>
  <filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="2"/><feColorMatrix values="0 0 0 0 .30  0 0 0 0 .22  0 0 0 0 .14  .75 0 0 0 -.18"/></filter>
  <filter id="blot" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="11"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .27  0 0 0 0 .16  .9 0 0 0 -.38"/></filter>
  <radialGradient id="vig" cx="50%" cy="48%" r="72%"><stop offset="62%" stop-color="#3b2f24" stop-opacity="0"/><stop offset="100%" stop-color="#3b2f24" stop-opacity=".42"/></radialGradient>
  <radialGradient id="gold" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffe9a0"/><stop offset="60%" stop-color="#e2a93a" stop-opacity=".7"/><stop offset="100%" stop-color="#e2a93a" stop-opacity="0"/></radialGradient>
</defs></svg>`;

// Papierstruktur als eigene Ebene über der Szene (bleibt beim Animieren unverändert)
export const GRAIN = `<svg class="grain" viewBox="0 0 800 500" preserveAspectRatio="none" aria-hidden="true">
  <rect width="800" height="500" filter="url(#blot)" opacity=".5"/><rect width="800" height="500" filter="url(#paper)"/><rect width="800" height="500" fill="url(#vig)"/></svg>`;

const wash = (list) => `<g filter="url(#soft)" opacity=".8">${list.map(([cx, cy, rx, ry, f]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}"/>`).join('')}</g>`;

function gear(r, n) {
  const ri = r * 0.76;
  const p = (rad, a) => `${(rad * Math.cos(a)).toFixed(1)} ${(rad * Math.sin(a)).toFixed(1)}`;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI, s = Math.PI / n;
    d += `${i ? 'L' : 'M'}${p(ri, a - s * 0.55)} L${p(r, a - s * 0.3)} L${p(r, a + s * 0.3)} L${p(ri, a + s * 0.55)} `;
  }
  return `${d}Z`;
}
const gearG = (x, y, r, n, cls, fill) => `<g transform="translate(${x},${y})"><g class="${cls}"><g ${A}><path d="${gear(r, n)}" fill="${fill}"/><circle r="${Math.round(r * 0.28)}" fill="#3b2f24"/></g></g></g>`;

// ---------- Figuren ----------

const keeper = (x, y) => `<g transform="translate(${x},${y})"><g class="hero"><g class="bob"><g ${A}>
  <path d="M-7 0 V14 M7 0 V14 M-12 15 H-4 M4 15 H12" stroke-width="4"/>
  <path d="M-14 2 Q-17 -34 0 -37 Q17 -34 14 2Z" fill="#4f7a78"/>
  <path d="M-7 -36 V-22 H7 V-36" stroke-width="1.6"/><circle cx="-7" cy="-21" r="1.6" fill="#c9a24a"/><circle cx="7" cy="-21" r="1.6" fill="#c9a24a"/>
  <path d="M-13 -24 L-26 -8"/><path d="M-30 -2 l5 -8 l5 3 l-2 4 l-4 -1 l-2 4Z" fill="#8d8a80" stroke-width="1.6"/><path d="M13 -24 L22 -10"/>
  <circle cx="0" cy="-52" r="15.5" fill="#edcfa6"/>
  <path d="M-15.5 -57 Q-15 -74 0 -74 Q15 -74 15.5 -57Z" fill="#c9584e"/><path d="M8 -59 Q26 -60 27 -54 L10 -55Z" fill="#a8443c"/>
  <circle class="blink" cx="-5" cy="-51" r="1.9" fill="#3b2f24"/><circle class="blink" cx="6" cy="-51" r="1.9" fill="#3b2f24"/>
  <path d="M-4 -44 q5 4 9 0" stroke-width="1.6"/>
  <ellipse cx="-10" cy="-46" rx="3" ry="2" fill="#e39a86" stroke="none" opacity=".7"/><ellipse cx="11" cy="-46" rx="3" ry="2" fill="#e39a86" stroke="none" opacity=".7"/>
</g></g></g></g>`;

const duck = (x, y) => `<g transform="translate(${x},${y})"><g class="waddle"><g ${A}>
  <path d="M-4 10 V17 M5 10 V17 M-8 18 H-1 M2 18 H9" stroke="#c97a2e" stroke-width="2.4"/>
  <path d="M-18 -2 Q-24 -10 -16 -8 Q-10 -16 6 -12 Q18 -8 16 2 Q12 12 -4 12 Q-16 10 -18 -2Z" fill="#f5eedb"/>
  <circle cx="12" cy="-18" r="9.5" fill="#f5eedb"/><path d="M19 -20 L30 -17 L20 -13Z" fill="#e0943a"/>
  <circle class="blink" cx="14" cy="-20" r="1.7" fill="#3b2f24"/><path d="M4 -27 Q12 -34 21 -26" fill="#4f7a78" stroke-width="1.6"/>
  <path class="thin" d="M-8 0 q6 5 14 0"/>
</g></g></g>`;

const explorer = (x, y) => `<g transform="translate(${x},${y})"><g class="hero"><g class="bob"><g ${A}>
  <path d="M-7 0 V14 M7 0 V14 M-12 15 H-4 M4 15 H12" stroke-width="4"/>
  <path d="M-20 -30 Q-28 -28 -26 -8 Q-24 0 -14 -2Z" fill="#8a6a3c"/><path d="M-24 -32 l8 -6" stroke-width="5" stroke="#efdfae"/>
  <path d="M-14 2 Q-17 -34 0 -37 Q17 -34 14 2Z" fill="#b9a26a"/>
  <path d="M-12 -34 Q0 -26 12 -34 L14 -27 Q0 -19 -14 -27Z" fill="#c9584e"/><path d="M-13 -22 L-18 -6"/>
  <circle cx="0" cy="-52" r="15.5" fill="#d9b48a"/>
  <ellipse cx="0" cy="-63" rx="25" ry="6" fill="#7d8a5a"/><path d="M-14 -64 Q-13 -80 0 -80 Q13 -80 14 -64Z" fill="#7d8a5a"/><path d="M-14 -67 Q0 -62 14 -67" stroke-width="3"/>
  <circle class="blink" cx="-5" cy="-51" r="1.9" fill="#3b2f24"/><circle class="blink" cx="6" cy="-51" r="1.9" fill="#3b2f24"/>
  <path d="M-4 -44 q5 4 9 0" stroke-width="1.6"/>
  <ellipse cx="-10" cy="-46" rx="3" ry="2" fill="#d98a76" stroke="none" opacity=".7"/><ellipse cx="11" cy="-46" rx="3" ry="2" fill="#d98a76" stroke="none" opacity=".7"/>
  <path d="M13 -24 L22 -24"/>
  <g class="swing"><circle cx="24" cy="-6" r="20" fill="url(#gold)" stroke="none" opacity=".8"/><path d="M22 -24 V-16"/><path d="M17 -16 H29 L27 2 H19Z" fill="#f8cf55"/><path d="M16 -16 H30 M18 2 H28" stroke-width="3"/></g>
</g></g></g></g>`;

const beetle = (x, y) => `<g transform="translate(${x},${y})"><g ${A}>
  <path d="M-13 0 l-7 8 M-4 2 l-3 9 M6 2 l3 9 M14 0 l7 8" stroke-width="2"/>
  <path d="M-17 0 Q-17 -20 0 -20 Q17 -20 17 0Z" fill="#c9a24a"/><path class="thin" d="M0 -20 V0 M-10 -14 q4 4 2 12"/>
  <circle cx="9" cy="-9" r="5" fill="#f5eedb"/><circle class="blink" cx="10" cy="-9" r="2" fill="#3b2f24"/>
  <path d="M-6 -19 L-10 -32"/><circle class="bulb" cx="-10" cy="-34" r="3.5" fill="#c9584e"/>
</g></g>`;

const penguin = (x, y, cls = '') => `<g transform="translate(${x},${y})"><g class="${cls}"><g ${A}>
  <path d="M-5 18 l-5 4 h8Z M5 18 l5 4 h-8Z" fill="#e0943a" stroke-width="1.4"/>
  <ellipse rx="13" ry="19" fill="#3d4650"/><ellipse cy="4" rx="8.5" ry="13" fill="#f5eedb" stroke-width="1.4"/>
  <path d="M-13 -4 q-7 8 -4 16 M13 -4 q7 8 4 16"/>
  <circle cx="-4" cy="-10" r="2.4" fill="#f5eedb" stroke="none"/><circle cx="4" cy="-10" r="2.4" fill="#f5eedb" stroke="none"/>
  <circle cx="-4" cy="-10" r="1.1" fill="#3b2f24" stroke="none"/><circle cx="4" cy="-10" r="1.1" fill="#3b2f24" stroke="none"/>
  <path d="M-3 -6 L0 -1 L3 -6Z" fill="#e0943a" stroke-width="1.2"/>
</g></g></g>`;

const heart = (x, y) => `<path class="heart" d="M${x} ${y} q-10 -14 -18 -4 q-6 10 18 26 q24 -16 18 -26 q-8 -10 -18 4Z" fill="#c9584e" stroke="#3b2f24" stroke-width="2"/>`;

const mapPiece = (x, y) => `<g class="treasure"><circle cx="${x}" cy="${y}" r="70" fill="url(#gold)"/><g class="piece"><g ${A} transform="translate(${x - 400},${y - 350})">
  <path d="M372 322 L420 314 L432 352 L412 384 L376 372 L366 344Z" fill="#efdfae"/>
  <path d="M380 340 q10 -8 18 2 t16 4" stroke-dasharray="3 5" stroke-width="1.8"/><path d="M408 360 l8 8 M416 360 l-8 8" stroke="#c9584e" stroke-width="2.6"/>
</g></g></g>`;

// Lichterkette (Zoo): drei Laternen zeigen den Fortschritt
const lampChain = () => `<g ${AW}><path d="M40 62 Q250 124 400 60 Q560 112 760 56" stroke-width="1.6"/>${[[240, 93], [400, 61], [565, 85]].map(([x, y], i) => `<g transform="translate(${x},${y})"><path d="M0 0 V10"/><circle class="halo h${i + 1}" cy="24" r="22" fill="url(#gold)" stroke="none"/><rect x="-8" y="10" width="16" height="24" rx="5" fill="#5a5148"/><circle class="lamp l${i + 1}" cy="23" r="5.5"/></g>`).join('')}</g>`;

// Steinlampen (Expedition)
const stoneLamps = (pts) => `<g ${A}>${pts.map(([x, y], i) => `<circle class="halo h${i + 1}" cx="${x}" cy="${y}" r="22" fill="url(#gold)" stroke="none"/><path d="M${x - 10} ${y} l10 -12 l10 12 l-10 12Z" fill="#8d7f63"/><circle class="lamp l${i + 1}" cx="${x}" cy="${y}" r="5"/>`).join('')}</g>`;

const zooTrees = () => `<g ${AW}>
  <path d="M-10 255 Q10 150 70 175 Q100 105 160 150 Q215 150 215 215 Q250 230 240 262 L-10 262Z" fill="#6f7d4a" fill-opacity=".75"/>
  <path d="M560 262 Q548 215 592 200 Q600 130 668 150 Q720 105 762 165 Q812 170 812 262Z" fill="#5f7350" fill-opacity=".75"/>
  <path class="thin" d="M60 200 q14 -12 26 2 M120 180 q12 -10 24 4 M640 190 q14 -12 26 2 M716 176 q12 -10 22 4"/></g>`;

const jungle = () => `<g ${AW}>
  <path d="M-10 300 Q-6 170 60 190 Q80 110 150 160 Q200 150 205 230 Q230 250 214 300Z" fill="#5f7350" fill-opacity=".8"/>
  <path d="M590 300 Q572 240 610 215 Q615 130 690 160 Q740 100 790 170 Q815 180 812 300Z" fill="#55694a" fill-opacity=".8"/>
  <path d="M40 0 Q52 60 36 110 Q30 150 44 180 M90 0 Q80 50 96 90 M735 0 Q724 70 742 120 Q750 150 738 176 M690 0 Q700 40 688 78" stroke="#4c5f3c"/>
  <path d="M36 110 q-14 -4 -16 8 q12 6 16 -8Z M44 180 q14 -6 18 6 q-12 8 -18 -6Z M96 90 q12 -8 18 2 q-10 10 -18 -2Z M742 120 q14 -6 18 6 q-12 8 -18 -6Z M738 176 q-14 -4 -16 8 q12 6 16 -8Z M688 78 q-12 -6 -16 4 q10 8 16 -4Z" fill="#6f7d4a"/></g>`;

const open = (id, bg) => `<svg class="scene sc-${id}" id="scene" viewBox="0 0 800 500" style="--p:0" role="img" aria-label="Szene"><rect width="800" height="500" fill="${bg}"/>`;

// ---------- Zoo 1: Das alte Tor ----------
function zooTor() {
  return `${open('zooTor', '#e6dcc0')}
  ${wash([[400, 70, 520, 150, '#a9c4bd'], [400, 250, 130, 90, '#efe3b4'], [90, 300, 190, 110, '#8fa06a'], [720, 290, 190, 110, '#7f956a'], [400, 480, 520, 85, '#b59a6a']])}
  ${zooTrees()}${lampChain()}
  <defs><clipPath id="above"><rect width="800" height="346"/></clipPath></defs>
  <g clip-path="url(#above)"><g class="giraffe"><g ${A}>
    <path d="M588 420 Q596 240 613 158 L642 160 Q642 250 654 420Z" fill="#dcae55"/>
    <path d="M602 250 q10 -8 16 4 q-4 12 -14 8Z M626 215 q9 -5 12 6 q-5 9 -12 4Z M606 310 q12 -6 18 6 q-6 12 -18 6Z M630 280 q8 -4 12 6 q-6 8 -12 2Z M618 180 q7 -4 10 4 q-4 7 -10 3Z" fill="#9a6630" stroke-width="1.4"/>
    <path d="M606 132 Q590 118 584 128 Q590 142 608 142Z" fill="#dcae55"/><path d="M619 122 L614 98 M637 119 L640 95"/>
    <circle cx="614" cy="96" r="5" fill="#7a4f28"/><circle cx="640" cy="93" r="5" fill="#7a4f28"/>
    <ellipse cx="630" cy="138" rx="29" ry="21" transform="rotate(-12 630 138)" fill="#dcae55"/><ellipse cx="655" cy="148" rx="18" ry="12.5" transform="rotate(-8 655 148)" fill="#ecd29a"/>
    <circle class="blink" cx="634" cy="131" r="4" fill="#3b2f24"/><path d="M660 144 l1.5 1 M648 154 q8 5 16 0" stroke-width="1.8"/>
    <ellipse cx="620" cy="146" rx="5" ry="3" fill="#e8a08a" stroke="none" opacity=".7"/></g>${heart(690, 96)}</g></g>
  <g ${AW}>
    <path d="M-10 252 Q160 240 300 250 L300 345 L-10 345Z" fill="#b8866a"/><path d="M500 250 Q650 240 810 252 L810 345 L500 345Z" fill="#b8866a"/>
    <path class="thin" d="M-10 276 H300 M-10 300 H300 M-10 324 H300 M40 252 V276 M110 252 V276 M190 250 V276 M250 250 V276 M70 276 V300 M150 276 V300 M230 276 V300 M30 300 V324 M120 300 V324 M200 300 V324 M270 300 V324 M500 276 H810 M500 300 H810 M500 324 H810 M560 250 V276 M700 246 V276 M770 250 V276 M530 276 V300 M680 276 V300 M750 276 V300 M580 300 V324 M720 300 V324"/>
    <path d="M-10 250 Q10 232 34 246 Q52 228 78 244 Q92 262 70 280 Q40 300 20 280 Q-4 290 -10 270Z" fill="#6f7d4a"/>
    <path d="M700 248 Q716 226 742 240 Q768 226 790 244 Q812 250 812 300 Q790 312 772 294 Q748 304 730 284 Q704 280 700 248Z" fill="#647a4c"/>
    <path d="M328 345 L386 268 H414 L472 345Z" fill="#dccb9c" stroke-width="1.4"/><path class="thin" d="M372 300 h18 M400 322 h22 M392 284 h14"/>
    <path d="M284 345 V192 H322 V345Z M478 345 V192 H516 V345Z" fill="#a8775c"/><path d="M277 192 H329 L321 178 H285Z M471 192 H523 L515 178 H479Z" fill="#96684f"/>
    <path class="thin" d="M284 230 H322 M284 268 H322 M284 306 H322 M478 230 H516 M478 268 H516 M478 306 H516"/>
    <path d="M303 180 Q400 78 497 180" stroke-width="5.5" stroke="#3a3430"/><path d="M303 196 Q400 104 497 196" stroke-width="2"/>
  </g>
  <g filter="url(#wob2)" font-size="22" text-anchor="middle" fill="#3b2f24">
    <g><path class="art" d="M350 146 V152"/><circle class="art" cx="350" cy="170" r="18" fill="#c9a24a"/><text x="350" y="178">Z</text></g>
    <g class="plate"><path class="art" d="M400 124 V134"/><circle class="art" cx="400" cy="152" r="18" fill="#c9a24a"/><text x="400" y="160">O</text></g>
    <g><path class="art" d="M450 146 V152"/><circle class="art" cx="450" cy="170" r="18" fill="#c9a24a"/><text x="450" y="178">O</text></g>
  </g>
  <g class="wing wingL"><g ${A} stroke="#3a3430"><path d="M324 232 Q362 214 400 222 V345 H324Z" fill="#3a3430" fill-opacity=".12" stroke-width="3"/><path d="M339 226 V345 M354 222 V345 M369 220 V345 M385 220 V345 M324 262 H400 M324 318 H400" stroke-width="2"/></g></g>
  <g class="wing wingR"><g ${A} stroke="#3a3430"><path d="M476 232 Q438 214 400 222 V345 H476Z" fill="#3a3430" fill-opacity=".12" stroke-width="3"/><path d="M461 226 V345 M446 222 V345 M431 220 V345 M415 220 V345 M476 262 H400 M476 318 H400" stroke-width="2"/></g></g>
  <g ${AW}>
    <path d="M-10 345 H810" stroke-width="2"/><path class="thin" d="M340 372 q30 -8 60 0 q30 8 60 0 M300 410 q50 -10 100 0 q50 10 100 0 M250 455 q70 -12 150 0 q80 12 150 0"/>
    <path d="M20 372 q4 -18 8 0 q4 -22 9 0 q5 -16 8 0 M690 380 q4 -18 8 0 q4 -22 9 0 q5 -16 8 0 M600 462 q4 -18 8 0 q4 -22 9 0 M740 440 q4 -16 8 0 q5 -20 9 0" stroke="#55663a"/>
    <path d="M160 404 H226 Q248 404 248 424 V436 H300" stroke-width="9" stroke="#6b5d4f"/><path d="M82 410 V428 M146 410 V428"/>
    <rect x="68" y="296" width="94" height="116" rx="16" fill="#a65a2e"/><path d="M68 330 H162 M68 384 H162" stroke-width="1.6"/>
    <circle cx="78" cy="322" r="2" fill="#3b2f24"/><circle cx="152" cy="322" r="2" fill="#3b2f24"/><circle cx="78" cy="392" r="2" fill="#3b2f24"/><circle cx="152" cy="392" r="2" fill="#3b2f24"/>
    <path d="M100 296 V268 H124 V296" fill="#8a4a26"/><path d="M94 268 H130"/>
    <rect x="172" y="306" width="16" height="96" rx="8" fill="#f1e9d2"/><path class="thin" d="M176 330 h8 M176 354 h8 M176 378 h8"/>
  </g>
  <rect class="water" x="175" y="310" width="10" height="88" rx="5" fill="#5f9aa8" opacity=".9"/>
  <circle class="puff" cx="112" cy="256" r="9" fill="#f4eede" stroke="#3b2f24" stroke-width="1.4"/><circle class="puff p2" cx="118" cy="252" r="7" fill="#f4eede" stroke="#3b2f24" stroke-width="1.4"/>
  <g transform="translate(115,357)"><g class="wheel"><g ${A}><circle r="19" fill="#c9a24a" fill-opacity=".9"/><circle r="5" fill="#3b2f24"/><path d="M-19 0 H19 M0 -19 V19 M-13 -13 L13 13 M-13 13 L13 -13" stroke-width="1.8"/></g></g></g>
  ${keeper(236, 440)}${duck(548, 452)}</svg>`;
}

// ---------- Zoo 2: Das Pinguinbecken ----------
function zooBecken() {
  let wave = 'M140 322';
  for (let x = 140; x < 660; x += 40) wave += ' q10 -7 20 0 t20 0';
  return `${open('zooBecken', '#e6dcc0')}
  ${wash([[400, 60, 520, 140, '#a9c4bd'], [620, 90, 130, 70, '#f3e6b6'], [90, 230, 200, 90, '#8fa06a'], [720, 230, 190, 90, '#7f956a']])}
  ${zooTrees()}${lampChain()}
  <g ${AW}>
    <path d="M230 300 Q250 190 330 200 Q360 140 430 170 Q500 150 520 220 Q570 230 580 300Z" fill="#c9d3d0"/>
    <path class="thin" d="M300 230 q20 20 10 50 M450 190 q-10 30 14 54 M520 250 q-14 10 -8 30"/>
    <path d="M378 300 Q378 250 410 250 Q442 250 442 300Z" fill="#3d4650"/>
    <path d="M-10 300 H810 V510 H-10Z" fill="#a98a64"/>
    <path class="thin" d="M20 340 l30 20 M70 420 l40 14 M700 350 l40 24 M690 440 l50 10 M30 470 l40 6"/>
    <path d="M146 300 V440 H654 V300Z" fill="#ddd2b4"/>
    <path class="thin" d="M146 345 H654 M146 392 H654 M230 300 V440 M330 300 V440 M430 300 V440 M530 300 V440"/>
  </g>
  <defs><clipPath id="basin"><rect x="146" y="290" width="508" height="150"/></clipPath></defs>
  ${penguin(300, 319, 'pg-swim float')}${penguin(420, 322, 'pg-swim float f2')}${penguin(540, 319, 'pg-swim float f3')}
  <g clip-path="url(#basin)"><g class="waterlvl"><rect x="140" y="322" width="520" height="130" fill="#5f9aa8" opacity=".78"/><path d="${wave}" fill="none" stroke="#eef6f4" stroke-width="2.5" opacity=".8"/></g>
    <path class="stream" d="M172 296 V440" stroke="#7fb4bf" stroke-width="7" stroke-linecap="round" stroke-dasharray="14 8"/></g>
  <g ${AW}><path d="M140 294 V446 H660 V294" stroke-width="8" stroke="#7a6d5c"/><path d="M-10 300 H136 M664 300 H810" stroke-width="2"/>
    <path d="M-10 240 H150 Q172 240 172 262 V292" stroke-width="12" stroke="#6b5d4f"/><path d="M160 292 H184" stroke-width="5"/>
    <path d="M690 300 q4 -18 8 0 q4 -22 9 0 M30 300 q4 -16 8 0" stroke="#55663a"/></g>
  <g transform="translate(96,240)"><g class="wheel"><g ${A}><circle r="17" fill="#c9a24a"/><circle r="4.5" fill="#3b2f24"/><path d="M-17 0 H17 M0 -17 V17 M-12 -12 L12 12 M-12 12 L12 -12" stroke-width="1.8"/></g></g></g>
  ${penguin(690, 278, 'pg-land')}${penguin(726, 278, 'pg-land')}${penguin(762, 278, 'pg-land')}
  <g class="splash" ${A}><path d="M290 318 q-8 -16 -2 -24 M306 318 q6 -18 14 -22 M412 322 q-6 -16 0 -26 M430 322 q8 -14 14 -18 M532 318 q-8 -16 -2 -24 M550 318 q6 -18 14 -22" stroke="#7fb4bf"/></g>
  ${heart(420, 222)}
  ${keeper(52, 285)}${duck(118, 281)}</svg>`;
}

// ---------- Zoo 3: Die Futterbahn ----------
function zooBahn() {
  return `${open('zooBahn', '#e6dcc0')}
  ${wash([[400, 70, 520, 150, '#a9c4bd'], [150, 110, 130, 70, '#f3e6b6'], [90, 290, 190, 100, '#8fa06a'], [720, 280, 190, 110, '#7f956a'], [400, 470, 520, 90, '#b59a6a']])}
  ${zooTrees()}${lampChain()}
  <g ${AW}>
    <path d="M40 390 V270 H180 V390Z" fill="#b8866a"/><path d="M26 274 L110 212 L194 274Z" fill="#a65a2e"/>
    <path d="M66 390 V320 H106 V390Z" fill="#6b4a35"/><rect x="128" y="300" width="34" height="30" fill="#efe3b4"/><path class="thin" d="M145 300 V330 M128 315 H162"/>
    <rect x="56" y="284" width="62" height="22" rx="3" fill="#c9a24a"/>
    <rect x="-4" y="356" width="36" height="34" fill="#c9a24a"/><path class="thin" d="M-4 356 L32 390 M32 356 L-4 390"/>
    <path d="M-10 390 H810" stroke-width="2"/>
    <path d="M250 340 V390 M350 340 V390 M450 340 V390 M550 340 V390" stroke-width="4" stroke="#6b5d4f"/>
    <path d="M196 338 H586 M586 326 V350" stroke-width="5" stroke="#3a3430"/>
    <path class="thin" d="M250 430 q70 -10 150 0 q80 10 150 0 M120 460 q60 -8 120 0"/>
    <path d="M300 468 q4 -18 8 0 q4 -22 9 0 M470 420 q4 -16 8 0 q5 -20 9 0 M40 440 q4 -18 8 0 q4 -22 9 0" stroke="#55663a"/>
  </g>
  <text x="87" y="301" font-size="15" text-anchor="middle" fill="#3b2f24" filter="url(#wob2)">Futter</text>
  ${gearG(206, 300, 17, 8, 'crank', '#c9a24a')}
  <g ${AW}>
    <path d="M662 340 V394 H684 V340Z M704 340 V394 H726 V340Z M744 340 V394 H766 V340Z" fill="#8b9497"/>
    <ellipse cx="715" cy="305" rx="82" ry="58" fill="#9aa3a6"/><path d="M794 288 q14 12 6 30" />
    <circle cx="640" cy="268" r="41" fill="#a3acae"/>
    <path d="M656 238 Q702 224 702 270 Q696 306 660 298Z" fill="#8b9497"/>
    <circle class="blink" cx="628" cy="261" r="3.6" fill="#3b2f24"/><path d="M618 292 q-6 10 2 16" stroke-width="3" stroke="#f5eedb"/>
    <ellipse cx="640" cy="280" rx="6" ry="3.5" fill="#e39a86" stroke="none" opacity=".6"/>
  </g>
  <g transform="translate(612,280)"><g class="trunk"><g ${A}><path d="M-8 -8 Q-30 20 -24 62 Q-22 78 -9 73 Q-6 60 -8 44 Q-6 20 10 6Z" fill="#a3acae"/><path class="thin" d="M-20 30 h10 M-20 46 h10"/></g></g></g>
  <g class="cart" transform="translate(240,338)"><g class="cartin"><g ${A}>
    <circle cx="-12" cy="-41" r="7.5" fill="#c9584e"/><circle cx="3" cy="-45" r="8.5" fill="#8fa06a"/><circle cx="16" cy="-40" r="7" fill="#c9584e"/>
    <path d="M-28 -34 H28 L22 -7 H-22Z" fill="#a65a2e"/><path class="thin" d="M-24 -22 H24"/>
    <circle cx="-14" cy="-3" r="6.5" fill="#3a3430"/><circle cx="14" cy="-3" r="6.5" fill="#3a3430"/></g></g></g>
  <g ${AW}><path d="M600 330 V392 M636 330 V392 M672 330 V392 M708 330 V392 M744 330 V392 M780 330 V392" stroke-width="4" stroke="#6b4a35"/><path d="M590 346 H810 M590 374 H810" stroke-width="3.5" stroke="#6b4a35"/></g>
  ${heart(640, 196)}
  ${keeper(300, 432)}${duck(370, 446)}</svg>`;
}

// ---------- Expedition 1: Das Tor der Zahlen ----------
function expTor() {
  return `${open('expTor', '#e2d6b4')}
  <defs><clipPath id="door"><path d="M330 422 V252 Q400 190 470 252 V422Z"/></clipPath></defs>
  ${wash([[130, 130, 240, 160, '#7f9166'], [680, 110, 250, 160, '#6f8a72'], [400, 50, 190, 80, '#f3e6b6'], [400, 480, 520, 90, '#9a7b52']])}
  ${jungle()}
  <g ${AW}>
    <path d="M205 422 L228 132 Q400 58 572 132 L595 422Z" fill="#bcad8c"/>
    <path class="thin" d="M224 200 H576 M219 270 H330 M470 270 H581 M213 345 H330 M470 345 H587 M300 130 V200 M400 96 V200 M500 130 V200 M262 200 V270 M538 200 V270 M250 270 V345 M552 270 V345 M282 345 V422 M518 345 V422"/>
    <path d="M312 422 V246 Q400 168 488 246 V422" stroke-width="3"/><path d="M330 422 V252 Q400 190 470 252 V422Z" fill="#2a221d"/>
    <path d="M176 422 H624 L646 446 H154Z" fill="#a69777"/><path d="M154 446 H646 L672 476 H128Z" fill="#97896b"/>
    <path d="M560 128 Q574 190 556 240 Q548 280 562 318" stroke="#4c5f3c"/>
    <path d="M556 240 q16 -6 20 6 q-12 8 -20 -6Z M562 318 q-16 -4 -18 8 q12 6 18 -8Z M568 180 q14 -8 20 2 q-10 10 -20 -2Z" fill="#6f7d4a"/>
  </g>
  ${stoneLamps([[352, 176], [400, 158], [448, 176]])}
  <g clip-path="url(#door)">${mapPiece(400, 350)}
    <g class="gate"><g ${A}><rect x="324" y="206" width="152" height="222" fill="#8f8165"/>
      <path class="thin" d="M324 280 H476 M324 352 H476 M400 206 V280 M362 280 V352 M438 280 V352 M400 352 V428"/>
      <circle cx="400" cy="316" r="24" fill="#7d7058"/><path d="M400 298 l5 12 l13 1 l-10 8 l4 13 l-12 -7 l-12 7 l4 -13 l-10 -8 l13 -1Z" fill="#c9a24a" stroke-width="1.6"/></g></g></g>
  ${gearG(258, 318, 24, 9, 'ga', '#c9a24a')}${gearG(292, 360, 17, 7, 'gb', '#a65a2e')}
  ${explorer(128, 440)}${beetle(196, 452)}
  <g ${AW}><path d="M-10 500 Q10 430 60 470 Q80 440 110 500Z M700 500 Q720 440 760 466 Q790 430 812 500Z" fill="#4c5f3c"/></g></svg>`;
}

// ---------- Expedition 2: Die Hängebrücke ----------
function expBruecke() {
  let planks = '';
  for (let i = 0; i < 12; i++) {
    const t = (i + 0.5) / 12;
    const x = 250 + 300 * t, y = 300 + 180 * t * (1 - t), yh = 258 + 168 * t * (1 - t);
    const ang = (Math.atan(0.6 * (1 - 2 * t)) * 180) / Math.PI;
    planks += `<g class="pl pl${Math.floor(i / 3) + 1}" style="transition-delay:${(i % 3) * 0.18}s"><path d="M${x.toFixed(1)} ${yh.toFixed(1)} V${y.toFixed(1)}" stroke-width="1.4"/><rect x="${(x - 11).toFixed(1)}" y="${(y - 3).toFixed(1)}" width="22" height="7" rx="2" fill="#a8703a" transform="rotate(${ang.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/></g>`;
  }
  return `${open('expBruecke', '#e2d6b4')}
  ${wash([[110, 120, 240, 150, '#7f9166'], [690, 110, 250, 150, '#6f8a72'], [400, 40, 170, 70, '#f3e6b6'], [400, 480, 260, 70, '#cfe0d8']])}
  <g ${AW}>
    <path d="M250 340 Q300 130 372 56 L430 56 Q500 130 550 340Z" fill="#a9a58a"/>
    <path d="M372 56 Q360 200 374 340 L428 340 Q440 200 430 56Z" fill="#d6e6e2"/>
    <path class="thin" d="M388 70 Q380 200 390 330 M404 66 Q400 200 406 334 M418 72 Q424 200 416 330"/>
  </g>
  ${jungle()}
  <g ${AW}>
    <path d="M225 510 Q400 462 575 510Z" fill="#7fa7ad"/>
    <path d="M-10 300 H250 Q264 360 240 420 Q252 470 228 510 H-10Z" fill="#b29a74"/>
    <path d="M810 300 H550 Q536 360 560 420 Q548 470 572 510 H810Z" fill="#b29a74"/>
    <path d="M-10 292 Q120 282 250 294 V302 H-10Z M810 292 Q680 282 550 294 V302 H810Z" fill="#6f7d4a"/>
    <path class="thin" d="M60 350 q30 20 20 60 M190 340 q-20 40 0 80 M620 350 q20 30 6 70 M740 340 q-16 40 4 90"/>
    <path d="M246 302 V250 M554 302 V250" stroke-width="6" stroke="#6b4a35"/>
    <path d="M246 258 Q400 342 554 258" stroke-width="2.2"/><path d="M250 300 Q400 390 550 300" stroke-width="2.2"/>
    <path d="M70 300 V232 Q90 216 110 232 V300Z" fill="#8f8165"/>
    <path d="M664 300 V236 H686 V300Z M724 300 V236 H746 V300Z" fill="#8f8165"/><path d="M656 236 H754 L744 220 H666Z" fill="#7d7058"/>
  </g>
  ${stoneLamps([[90, 282], [90, 262], [90, 242]])}
  <g ${AW}>${planks}</g>
  ${gearG(208, 280, 18, 8, 'winch', '#c9a24a')}
  ${mapPiece(705, 262)}
  <g class="walker">${explorer(150, 284)}${beetle(196, 296)}</g>
  <g ${AW}><path d="M-10 500 Q10 440 50 470 Q70 446 96 500Z M720 500 Q740 446 770 468 Q794 440 812 500Z" fill="#4c5f3c"/></g></svg>`;
}

// ---------- Expedition 3: Die Kammer der Waage ----------
function expWaage() {
  const torch = (x) => `<g ${A}><circle cx="${x}" cy="196" r="46" fill="url(#gold)" stroke="none" opacity=".7"/><path d="M${x} 250 V214 M${x - 9} 214 H${x + 9}" stroke-width="4" stroke="#6b4a35"/><path class="flame" d="M${x} 212 q-11 -14 0 -30 q11 16 0 30Z" fill="#f2a53a"/></g>`;
  const pan = (x, inner) => `<g transform="translate(${x},0)"><g class="pan"><g ${A}><path d="M0 0 L-34 74 M0 0 L34 74" stroke-width="1.6"/>${inner}<path d="M-44 74 Q0 102 44 74Z" fill="#c9a24a"/></g></g></g>`;
  const idol = '<path d="M-11 76 V52 Q-15 40 0 36 Q15 40 11 52 V76Z" fill="#e2b84a"/><circle cx="0" cy="27" r="9" fill="#e2b84a"/><circle cx="-3" cy="26" r="1.2" fill="#3b2f24"/><circle cx="3" cy="26" r="1.2" fill="#3b2f24"/>';
  const stones = '<ellipse class="st st1" cx="-17" cy="68" rx="13" ry="9" fill="#8f8165"/><ellipse class="st st2" cx="14" cy="68" rx="14" ry="9" fill="#7d7058"/><ellipse class="st st3" cx="-3" cy="55" rx="12" ry="8" fill="#97896b"/><ellipse class="st st4" cx="6" cy="43" rx="9" ry="6.5" fill="#8f8165"/>';
  return `${open('expWaage', '#cdbf9c')}
  ${wash([[0, 0, 260, 220, '#6b5d4f'], [800, 0, 260, 220, '#6b5d4f'], [400, 210, 280, 190, '#f3e2a8'], [400, 490, 520, 80, '#8a7558']])}
  <g ${AW}>
    <path class="thin" d="M-10 90 H810 M-10 170 H810 M-10 250 H810 M-10 330 H810 M150 10 V90 M330 10 V90 M560 10 V90 M700 10 V90 M230 90 V170 M580 90 V170 M160 170 V250 M300 170 V250 M520 170 V250 M640 170 V250 M220 250 V330 M590 250 V330 M150 330 V400 M290 330 V400 M510 330 V400 M650 330 V400"/>
    <path d="M-10 400 H810 V510 H-10Z" fill="#a69777"/><path class="thin" d="M100 400 L40 510 M300 400 L270 510 M500 400 L530 510 M700 400 L760 510 M-10 446 H810"/>
    <path d="M40 400 V70 H100 V400Z M700 400 V70 H760 V400Z" fill="#b5a685"/><path d="M30 70 H110 L102 50 H38Z M690 70 H770 L762 50 H698Z M30 400 H110 V416 H30Z M690 400 H770 V416 H690Z" fill="#a39474"/>
    <path class="thin" d="M56 80 V396 M84 80 V396 M716 80 V396 M744 80 V396"/>
    <circle cx="400" cy="92" r="42" fill="#a39474"/><circle cx="400" cy="92" r="35" fill="#2a221d"/>
  </g>
  ${torch(70)}${torch(730)}
  <g class="treasure"><circle cx="400" cy="92" r="46" fill="url(#gold)"/><g class="piece"><g ${A}><circle cx="400" cy="92" r="17" fill="#e2b84a"/><path d="M400 80 L405 92 L400 104 L395 92Z" fill="#c9584e" stroke-width="1.4"/><circle cx="400" cy="92" r="2" fill="#3b2f24"/></g></g></g>
  <g class="slab"><g ${A}><circle cx="400" cy="92" r="36" fill="#8f8165"/><path d="M400 92 q10 -10 0 -18 q-18 0 -18 18 q0 24 26 22" stroke-width="2"/></g></g>
  ${stoneLamps([[346, 160], [400, 168], [454, 160]])}
  <g ${AW}><path d="M400 196 V392" stroke-width="9" stroke="#6b5d4f"/><path d="M344 402 Q400 366 456 402Z" fill="#8f8165"/></g>
  <g transform="translate(400,196)"><g class="beam">
    <g ${A}><path d="M-135 0 H135" stroke-width="7" stroke="#6b4a35"/><circle r="9" fill="#c9a24a"/></g>
    ${pan(-135, idol)}${pan(135, stones)}
  </g></g>
  ${explorer(150, 426)}${beetle(214, 440)}</svg>`;
}


// ---------- Zoo 4: Der alte Kiosk ----------
function zooKiosk() {
  let stripes = '';
  for (let i = 0; i < 8; i += 2) stripes += `<path d="M${270 + 32.5 * i} 0 H${270 + 32.5 * (i + 1)} L${244 + 39 * (i + 1)} 46 H${244 + 39 * i}Z" fill="#c9584e"/>`;
  return `${open('zooKiosk', '#e6dcc0')}
  ${wash([[400, 70, 520, 150, '#a9c4bd'], [640, 100, 130, 70, '#f3e6b6'], [90, 290, 190, 100, '#8fa06a'], [720, 280, 190, 110, '#7f956a'], [400, 470, 520, 90, '#b59a6a']])}
  ${zooTrees()}${lampChain()}
  <defs><clipPath id="kwin"><rect x="304" y="246" width="192" height="88"/></clipPath></defs>
  <g class="balloons"><g ${A}><path d="M352 172 Q380 200 400 222 M400 148 V222 M450 172 Q420 200 400 222" stroke-width="1.4"/>
    <ellipse cx="350" cy="150" rx="19" ry="23" fill="#c9584e"/><ellipse cx="400" cy="124" rx="19" ry="23" fill="#e2b84a"/><ellipse cx="452" cy="150" rx="19" ry="23" fill="#4f8f8a"/></g></g>
  <g ${AW}>
    <path d="M-10 400 H810" stroke-width="2"/>
    <path d="M260 400 V224 H540 V400Z" fill="#c9b07a"/>
    <path class="thin" d="M290 340 V400 M330 346 V400 M370 346 V400 M410 346 V400 M450 346 V400 M490 346 V400 M520 232 V400 M280 232 V340"/>
    <path d="M244 226 L270 188 H530 L556 226Z" fill="#a65a2e"/>
    <rect x="336" y="150" width="128" height="38" rx="7" fill="#efe3b4"/>
    <rect x="304" y="246" width="192" height="88" fill="#3d3530"/>
    <path d="M574 400 V352 Q596 340 618 352 V400Z" fill="#8a6a3c"/><path class="thin" d="M574 368 H618 M574 386 H618"/>
    <path class="thin" d="M120 440 q60 -10 130 0 M480 452 q70 -10 140 0"/>
    <path d="M60 420 q4 -18 8 0 q4 -22 9 0 M700 430 q4 -16 8 0 q5 -20 9 0" stroke="#55663a"/>
  </g>
  <text x="400" y="178" font-size="26" text-anchor="middle" fill="#3b2f24" filter="url(#wob2)">KIOSK</text>
  <g clip-path="url(#kwin)">
    <g class="raccoon"><g ${A}>
      <path d="M376 278 l-5 -17 l15 8Z M424 278 l5 -17 l-15 8Z" fill="#6b6661"/>
      <path d="M371 302 Q371 268 400 268 Q429 268 429 302 Q429 330 400 332 Q371 330 371 302Z" fill="#a6a29a"/>
      <path d="M375 297 Q388 284 400 295 Q412 284 425 297 Q412 310 400 301 Q388 310 375 297Z" fill="#3d3530"/>
      <circle cx="389" cy="297" r="3.2" fill="#f5eedb" stroke="none"/><circle cx="411" cy="297" r="3.2" fill="#f5eedb" stroke="none"/>
      <circle cx="389" cy="297" r="1.4" fill="#3b2f24" stroke="none"/><circle cx="411" cy="297" r="1.4" fill="#3b2f24" stroke="none"/>
      <circle cx="400" cy="312" r="3" fill="#3b2f24"/><path d="M394 320 q6 5 12 0" stroke-width="1.6"/>
      <path d="M452 334 L462 302 H442Z" fill="#d9a05a"/><circle cx="452" cy="296" r="11" fill="#e8a8b0"/>
    </g></g>
    <g class="shutter"><g ${A}><rect x="302" y="244" width="196" height="92" fill="#8a6a3c"/><path class="thin" d="M302 262 H498 M302 280 H498 M302 298 H498 M302 316 H498"/><circle cx="400" cy="326" r="4" fill="#3b2f24"/></g></g>
  </g>
  <g ${AW}><rect x="290" y="334" width="220" height="13" rx="3" fill="#96684f"/></g>
  <g transform="translate(0,226)"><g class="awning"><g ${A}><path d="M270 0 H530 L556 46 H244Z" fill="#efe3b4"/>${stripes}<path d="M244 46 q19.5 12 39 0 t39 0 t39 0 t39 0 t39 0 t39 0 t39 0 t39 0" fill="#efe3b4"/></g></g></g>
  ${keeper(170, 440)}${duck(650, 452)}</svg>`;
}

// ---------- Zoo 5: Die große Voliere ----------
function zooVoliere() {
  let bars = '';
  for (let x = 250; x <= 550; x += 50) {
    const top = 250 - 150 * Math.sqrt(1 - ((x - 400) / 180) ** 2);
    bars += `M${x} 400 V${top.toFixed(0)} `;
  }
  const bird = (x, y, col, cls) => `<g transform="translate(${x},${y})"><g class="bird ${cls}"><g ${A}>
    <path d="M-4 10 Q-10 30 -2 40 Q2 28 4 12Z" fill="${col}"/><ellipse rx="10" ry="15" fill="${col}"/><path class="thin" d="M-6 -2 q6 10 2 18"/>
    <circle cx="3" cy="-17" r="8" fill="${col}"/><path d="M9 -19 q9 2 5 9 q-5 0 -6 -5Z" fill="#e0943a" stroke-width="1.4"/>
    <circle cx="4" cy="-19" r="1.6" fill="#3b2f24" stroke="none"/></g></g></g>`;
  const vine = (x, y, n) => `<g class="vine v${n}"><g ${A}><path d="M${x} ${y} q-40 -30 -10 -60 q10 -40 60 -30 q50 -10 50 40 q30 30 -10 55 q-50 30 -90 -5Z" fill="#5f7350"/>
    <path d="M${x + 10} ${y - 30} q14 -8 20 4 q-10 10 -20 -4Z M${x + 50} ${y - 50} q14 -8 20 4 q-10 10 -20 -4Z M${x + 40} ${y - 6} q14 -8 20 4 q-10 10 -20 -4Z" fill="#8fa06a" stroke-width="1.4"/></g></g>`;
  return `${open('zooVoliere', '#e6dcc0')}
  ${wash([[400, 70, 520, 150, '#a9c4bd'], [400, 250, 150, 130, '#efe3b4'], [90, 290, 190, 100, '#8fa06a'], [720, 280, 190, 110, '#7f956a'], [400, 470, 520, 90, '#b59a6a']])}
  ${zooTrees()}${lampChain()}
  <g ${AW}>
    <path d="M-10 400 H810" stroke-width="2"/>
    <path d="M394 400 Q396 300 400 226 M400 306 Q442 286 474 256 M400 276 Q362 256 334 232 M400 232 Q412 204 432 190" stroke-width="7" stroke="#7a5a3a"/>
    <path d="M220 400 V250 Q220 104 400 100 Q580 104 580 250 V400" stroke-width="4" stroke="#3a3430"/>
    <path d="${bars}" stroke-width="2" stroke="#3a3430"/>
    <path d="M220 250 Q400 282 580 250 M221 330 Q400 362 579 330" stroke-width="2" stroke="#3a3430"/>
    <circle cx="400" cy="92" r="8" fill="#c9a24a"/>
    <path d="M210 400 H590 V412 H210Z" fill="#96684f"/>
    <path class="thin" d="M120 446 q60 -10 130 0 M520 452 q70 -10 140 0"/>
    <path d="M60 424 q4 -18 8 0 q4 -22 9 0 M720 430 q4 -16 8 0 q5 -20 9 0" stroke="#55663a"/>
  </g>
  ${bird(474, 238, '#c9584e', 'b1')}${bird(336, 214, '#4f9a94', 'b2')}${bird(434, 172, '#e2b84a', 'b3')}
  <g class="vdoor"><g ${A} stroke="#3a3430"><path d="M372 400 V336 Q400 318 428 336 V400Z" fill="#3a3430" fill-opacity=".15" stroke-width="3"/><path d="M386 330 V400 M400 324 V400 M414 330 V400" stroke-width="1.8"/></g></g>
  ${vine(250, 240, 1)}${vine(460, 250, 2)}${vine(300, 370, 3)}${vine(430, 360, 4)}
  ${heart(520, 150)}
  ${keeper(140, 440)}${duck(670, 452)}</svg>`;
}

// ---------- Expedition 4: Der Flusshafen ----------
function expBoot() {
  const crate = (x, y, n) => `<g class="st st${n}"><rect x="${x}" y="${y}" width="30" height="28" fill="#c9a24a"/><path class="thin" d="M${x} ${y} l30 28 M${x + 30} ${y} l-30 28"/></g>`;
  return `${open('expBoot', '#e2d6b4')}
  ${wash([[130, 130, 240, 160, '#7f9166'], [680, 110, 250, 160, '#6f8a72'], [400, 50, 190, 80, '#f3e6b6'], [400, 470, 520, 80, '#9cc0c4']])}
  ${jungle()}
  <g ${AW}>
    <path d="M640 400 V346 H700 V314 H810 V400Z" fill="#bcad8c"/><path class="thin" d="M640 372 H810 M700 346 H810 M670 346 V400 M740 314 V400"/>
    <path d="M716 314 V250 H736 V314Z M774 314 V250 H794 V314Z" fill="#8f8165"/><path d="M708 250 H802 L792 234 H718Z" fill="#7d7058"/>
    <path d="M-10 400 H810 V510 H-10Z" fill="#8fb5b8"/>
    <path class="thin" d="M60 440 q10 -7 20 0 t20 0 M480 456 q10 -7 20 0 t20 0 M300 478 q10 -7 20 0 t20 0 M640 444 q10 -7 20 0 t20 0" stroke="#eef6f4"/>
    <path d="M-10 362 H176 V378 H-10Z" fill="#a8703a"/><path d="M30 378 V420 M90 378 V424 M150 378 V420" stroke-width="6" stroke="#6b4a35"/>
    <path d="M22 362 V276 Q40 262 58 276 V362Z" fill="#8f8165"/>
    <path d="M124 362 V248" stroke-width="7" stroke="#6b4a35"/>
  </g>
  ${stoneLamps([[40, 340], [40, 318], [40, 296]])}
  <g transform="translate(124,250)"><g class="crane"><g ${A}><path d="M-14 6 L96 -24" stroke-width="6" stroke="#6b4a35"/><path d="M96 -24 V26" stroke-width="1.6"/><path d="M90 26 q6 12 12 0" stroke-width="2.4"/></g></g></g>
  ${mapPiece(755, 270)}
  <g class="boat"><g class="float">
    <g ${A}><path d="M320 394 V246" stroke-width="5" stroke="#6b4a35"/><path d="M320 246 l22 8 l-22 8Z" fill="#c9584e"/></g>
    <g class="sail"><g ${A}><path d="M326 262 Q408 300 328 384Z" fill="#efe3b4"/><path class="thin" d="M330 300 q30 6 44 0 M330 340 q22 6 30 0"/></g></g>
    <g ${A}>${crate(352, 366, 1)}${crate(386, 366, 2)}${crate(369, 338, 3)}${crate(403, 338, 4)}</g>
    ${explorer(246, 380)}${beetle(292, 392)}
    <g ${A}><path d="M186 392 Q198 430 240 432 H404 Q444 430 456 392Z" fill="#8a6a3c"/><path class="thin" d="M200 408 H444 M214 420 H430"/></g>
  </g></g>
  <g ${AW}><path d="M-10 500 Q10 440 50 470 Q70 446 96 500Z M720 500 Q740 446 770 468 Q794 440 812 500Z" fill="#4c5f3c"/></g></svg>`;
}

// ---------- Expedition 5: Die Halle der Spiegel ----------
function expSpiegel() {
  const seg = (a, b, n) => `<g class="seg s${n}"><path d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}" stroke="#f2c14a" stroke-width="14" stroke-linecap="round" opacity=".35"/><path d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}" stroke="#fff3c0" stroke-width="3.5" stroke-linecap="round"/></g>`;
  const mirror = (x, y, n, rot) => `<g transform="translate(${x},${y}) rotate(${rot})"><g class="mirror m${n}"><g ${A}><ellipse rx="26" ry="8" fill="#cfe0e4"/><path class="thin" d="M-12 -2 h10"/></g></g></g>`;
  const P1 = [95, 95], P2 = [300, 330], P3 = [480, 150], P4 = [620, 330], P5 = [720, 196];
  return `${open('expSpiegel', '#c9bb98')}
  ${wash([[0, 500, 300, 200, '#5a4e42'], [800, 0, 300, 220, '#5a4e42'], [800, 500, 240, 160, '#5a4e42'], [400, 240, 300, 180, '#e2d2a0'], [90, 90, 120, 100, '#f6e9b8']])}
  <g ${AW}>
    <path class="thin" d="M-10 90 H810 M-10 170 H810 M-10 250 H810 M-10 330 H810 M210 10 V90 M380 10 V90 M560 10 V90 M700 10 V90 M150 90 V170 M330 90 V170 M580 90 V170 M240 170 V250 M400 170 V250 M560 170 V250 M160 250 V330 M360 250 V330 M540 250 V330 M90 330 V400 M250 330 V400 M440 330 V400 M560 330 V400"/>
    <path d="M-10 400 H810 V510 H-10Z" fill="#a69777"/><path class="thin" d="M100 400 L40 510 M300 400 L270 510 M500 400 L530 510 M700 400 L760 510 M-10 446 H810"/>
    <path d="M52 140 V70 Q95 30 138 70 V140Z" fill="#f6e9b8"/><path d="M44 140 H146" stroke-width="5"/>
    <path d="M300 400 V342 M620 400 V342" stroke-width="6" stroke="#6b4a35"/><path d="M280 402 H320 M600 402 H640" stroke-width="6" stroke="#6b4a35"/>
    <path d="M480 -10 V138" stroke-width="2" stroke-dasharray="6 5"/>
    <path d="M690 400 V236 H750 V400Z" fill="#b5a685"/><path d="M680 236 H760 L752 220 H688Z" fill="#a39474"/>
  </g>
  ${stoneLamps([[346, 60], [400, 52], [454, 60]])}
  ${seg(P1, P2, 1)}${seg(P2, P3, 2)}${seg(P3, P4, 3)}${seg(P4, P5, 4)}
  ${mirror(300, 334, 1, -8)}${mirror(480, 146, 2, 0)}${mirror(620, 334, 3, 12)}
  <g class="treasure"><circle cx="720" cy="190" r="60" fill="url(#gold)"/></g>
  <g ${A}><path class="crystal" d="M720 158 L742 190 L720 222 L698 190Z" fill="#9cc0c4"/><path class="thin" d="M720 158 V222 M698 190 H742"/></g>
  ${mapPiece(720, 96)}
  ${explorer(150, 426)}${beetle(214, 440)}</svg>`;
}

const SCENES = { zooTor, zooBecken, zooBahn, zooKiosk, zooVoliere, expTor, expBruecke, expWaage, expBoot, expSpiegel };
export const sceneSvg = (id) => SCENES[id]();

// ---------- Weltkarten ----------

const STAR = 'M0 -9 l2.6 5.6 6.2 .7 -4.6 4.2 1.3 6.1 -5.5 -3.1 -5.5 3.1 1.3 -6.1 -4.6 -4.2 6.2 -.7Z';
const ICONS = {
  zooTor: '<path d="M-20 22 V-6 M20 22 V-6 M-22 -6 Q0 -36 22 -6 M-8 22 V-4 M0 22 V-10 M8 22 V-4" stroke-width="3"/>',
  zooBecken: '<path d="M-26 14 q7 -8 13 0 t13 0 t13 0 t13 0" stroke="#4f7a78" stroke-width="3"/><ellipse cx="0" cy="-8" rx="10" ry="15" fill="#3d4650"/><ellipse cx="0" cy="-5" rx="6" ry="10" fill="#f5eedb" stroke-width="1.2"/><path d="M-2 -14 L0 -10 L2 -14Z" fill="#e0943a" stroke-width="1"/>',
  zooBahn: '<path d="M-20 -6 H20 L15 12 H-15Z" fill="#a65a2e"/><circle cx="-9" cy="16" r="5" fill="#3a3430"/><circle cx="9" cy="16" r="5" fill="#3a3430"/><circle cx="-7" cy="-13" r="6" fill="#c9584e"/><circle cx="7" cy="-14" r="6.5" fill="#8fa06a"/>',
  expTor: '<path d="M-20 22 V-4 Q0 -32 20 -4 V22Z" fill="#5a4e42"/><path d="M0 -6 l3 7 7 .6 -5.4 4.6 1.8 7 -6.4 -4 -6.4 4 1.8 -7 -5.4 -4.6 7 -.6Z" fill="#c9a24a" stroke-width="1.2"/>',
  expBruecke: '<path d="M-28 -8 Q0 14 28 -8 M-28 6 Q0 30 28 6 M-16 0 V14 M-5 5 V20 M6 5 V20 M17 0 V13" stroke-width="2.6"/>',
  expWaage: '<path d="M0 -22 V20 M-24 -16 H24 M-12 22 H12" stroke-width="3"/><path d="M-24 -16 l-9 18 h18Z M24 -16 l-9 18 h18Z" fill="#c9a24a"/>',
  zooKiosk: '<path d="M-22 22 V-4 H22 V22Z" fill="#c9b07a"/><path d="M-26 -4 L-20 -20 H20 L26 -4Z" fill="#c9584e"/><path d="M-10 -20 L-12 -4 M0 -20 V-4 M10 -20 L12 -4" stroke-width="1.6"/><rect x="-12" y="2" width="24" height="12" fill="#3d3530"/>',
  zooVoliere: '<path d="M-22 22 V-2 Q-22 -26 0 -26 Q22 -26 22 -2 V22Z M-11 22 V-20 M0 22 V-26 M11 22 V-20 M-22 4 H22" stroke-width="2.4"/><circle cx="0" cy="-30" r="3" fill="#c9a24a"/>',
  expBoot: '<path d="M-26 6 Q-22 22 -10 22 H10 Q22 22 26 6Z" fill="#8a6a3c"/><path d="M0 6 V-26" stroke-width="3"/><path d="M3 -22 Q24 -8 3 4Z" fill="#efe3b4"/>',
  expSpiegel: '<circle r="9" fill="#f2c14a"/><path d="M0 -24 V-15 M0 24 V15 M-24 0 H-15 M24 0 H15 M-17 -17 L-11 -11 M17 17 L11 11 M-17 17 L-11 11 M17 -17 L11 -11" stroke-width="2.6"/>',
  lock: '<rect x="-12" y="-4" width="24" height="20" rx="4" fill="#8d7f63"/><path d="M-7 -4 V-11 Q0 -20 7 -11 V-4" stroke-width="3"/>',
  soon: '<path d="M-7 -10 Q0 -22 8 -12 Q10 -4 0 2 V8" stroke-width="3.5"/><circle cx="0" cy="17" r="2.4" fill="#3b2f24"/>',
};
const POS = [[150, 335], [335, 205], [520, 318], [650, 170], [672, 372]];

export const badge = (sceneId) => `<svg class="badge" viewBox="-56 -56 112 112" aria-hidden="true"><g ${A}><circle r="48" fill="#e9dcb6"/>${ICONS[sceneId]}</g></svg>`;

// nodes: [{name, topic, scene, stars, locked, due}]
export function mapSvg(world, title, nodes) {
  const zoo = world === 'zoo';
  const path = `M${POS.map((p) => p.join(' ')).join(' L')}`;
  const deco = zoo
    ? `<g ${AW}><path d="M28 34 H772 V466 H28Z" stroke-dasharray="14 10" stroke-width="1.6" opacity=".5"/>
        <g transform="translate(-515,-322)"><path d="M560 420 Q600 392 650 408 Q690 420 668 446 Q620 466 572 450 Q548 438 560 420Z" fill="#9cc0c4"/><path class="thin" d="M590 426 q8 -5 16 0 M620 438 q8 -5 16 0"/></g>
        ${[[205, 96], [245, 126], [290, 462], [330, 478], [460, 130], [505, 100], [590, 100], [40, 262], [440, 476], [770, 262]].map(([x, y]) => `<path d="M${x} ${y} q-16 -4 -14 -20 q-4 -18 14 -20 q18 2 14 20 q2 16 -14 20Z M${x} ${y} v12" fill="#7f956a" fill-opacity=".85"/>`).join('')}
        <path class="thin" d="M560 230 q4 -14 8 0 q4 -16 8 0 M400 300 q4 -14 8 0 q4 -16 8 0 M610 470 q4 -14 8 0 q4 -16 8 0"/></g>`
    : `<g ${AW}><path d="M-10 420 Q80 380 120 430 Q150 470 110 510 H-10Z" fill="#9cc0c4"/><path class="thin" d="M20 440 q8 -6 16 0 t16 0 M40 470 q8 -6 16 0 t16 0"/>
        <path d="M590 92 l40 -64 l34 50 l22 -30 l40 64Z" fill="#a9a58a"/><path class="thin" d="M630 28 l-8 22 l12 -6 M686 48 l-6 18"/>
        ${[[40, 250], [300, 476], [230, 110], [460, 140], [640, 478], [775, 250]].map(([x, y]) => `<path d="M${x} ${y} v-34 M${x} ${y - 34} q-18 -10 -26 4 M${x} ${y - 34} q18 -10 26 4 M${x} ${y - 34} q-6 -18 -22 -14 M${x} ${y - 34} q6 -18 22 -14" stroke="#4c5f3c" stroke-width="2.4"/>`).join('')}
        <g transform="translate(92,84)"><circle r="34" fill="none" stroke-width="1.6"/><path d="M0 -42 L7 0 L0 42 L-7 0Z" fill="#c9584e" fill-opacity=".8"/><path d="M-42 0 L0 -7 L42 0 L0 7Z" fill="#efdfae"/></g>
        </g>`;
  const nodeSvg = nodes.map((n, i) => {
    const [x, y] = POS[i];
    const state = n.soon ? 'soon' : n.locked ? 'locked' : 'open';
    const icon = n.soon ? ICONS.soon : n.locked ? ICONS.lock : ICONS[n.scene];
    const fill = n.soon || n.locked ? '#cfc4a6' : n.stars ? (zoo ? '#cfe0b4' : '#ecd9a0') : '#efe6cc';
    const stars = n.soon ? '' : [0, 1, 2].map((k) => `<path d="${STAR}" transform="translate(${(k - 1) * 24},${-66 - (k === 1 ? 6 : 0)}) scale(1.15)" fill="${k < n.stars ? '#f2c14a' : 'none'}" stroke="#3b2f24" stroke-width="1.5" opacity="${k < n.stars ? 1 : 0.35}"/>`).join('');
    return `<g class="node ${state}${n.due ? ' due' : ''}" data-i="${i}" transform="translate(${x},${y})" role="button" tabindex="0" aria-label="${n.name}">
      <circle class="ring" r="62" fill="url(#gold)"/>
      <g ${A}><circle r="48" fill="${fill}"/>${icon}</g>${stars}
      <text y="76" text-anchor="middle" font-size="21" fill="#3b2f24">${n.name}</text>
      ${n.topic ? `<text y="96" text-anchor="middle" font-size="14" fill="#3b2f24" opacity=".7">${n.topic}</text>` : ''}</g>`;
  }).join('');
  return `<svg class="scene map" viewBox="0 0 800 500" role="img" aria-label="Karte"><rect width="800" height="500" fill="${zoo ? '#e6dcc0' : '#e4d6b0'}"/>
    ${wash(zoo ? [[200, 150, 300, 160, '#b7c79a'], [620, 330, 280, 170, '#a9c08f'], [420, 260, 200, 120, '#efe3b4']] : [[250, 250, 320, 200, '#d9c88f'], [620, 200, 260, 180, '#b7c092'], [80, 440, 180, 110, '#a9c4bd']])}
    ${deco}
    <path d="${path}" fill="none" stroke="#3b2f24" stroke-width="3" stroke-dasharray="3 11" stroke-linecap="round" filter="url(#wob)"/>
    <text x="400" y="52" text-anchor="middle" font-size="28" fill="#3b2f24">${title}</text>
    ${nodeSvg}</svg>`;
}
