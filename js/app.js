import { SCHEMAS, check, euro, pick, int } from './tasks.js';
import { fmt } from './tasks4.js';
import { generate, skillById, TOPICS, TOPIC_NAMES, GRADES, PLACEMENT } from './catalog.js';
import { recordAnswer, scheduleAfterSession, planRound, placeStars, coinsFor, placementLevels, accuracy, isDue, dayKey, DAY } from './learner.js';
import { SHOPS } from './shop.js';
import { load, save, newProfile, exportFile, importFile } from './store.js';
import { WORLDS } from './worlds.js';
import { DEFS, GRAIN, sceneSvg, mapSvg, badge } from './scenes.js';
import { renderVisual } from './visuals.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
document.body.insertAdjacentHTML('afterbegin', DEFS);
const app = $('#app');

let data = load();
let P = data.profiles.find((p) => p.id === data.activeId) || null; // aktives Profil
let session = null;
let tempo = null;
let keyHandler = null;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const persist = () => save(data);
const world = () => WORLDS[P.world];
const topicIds = (i) => TOPICS[P.grade][i];
const frame = (svg) => `<div class="frame"><div class="frame-in">${svg}${GRAIN}</div></div>`;
const PRAISE = ['Super gerechnet!', 'Stark!', 'Genau richtig!', 'Klasse!', 'Gut überlegt!', 'Prima!', 'Spitze!', 'Das sitzt!'];
const PRAISE_RETRY = ['Gut, dass du es nochmal versucht hast!', 'Drangeblieben, super!', 'Jetzt hast du es!'];
const ENCOURAGE = ['Fehler sind zum Lernen da.', 'Beim nächsten Mal klappt es besser.', 'Schau dir den Weg genau an.'];

// ---------- Ton & Sprache ----------
let audio;
function tone(kind) {
  if (!data.settings.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const notes = { ok: [523, 659, 784], bad: [330, 262], tick: [880, 1175], win: [523, 784, 1047, 1319], gear: [196, 147] }[kind];
    notes.forEach((f, i) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = kind === 'bad' || kind === 'gear' ? 'triangle' : 'sine';
      o.frequency.value = f;
      const t = audio.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + 0.3);
    });
  } catch { /* Ton ist optional */ }
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const t = text.replace(/·/g, ' mal ').replace(/ : /g, ' geteilt durch ').replace(/−/g, ' minus ').replace(/≈/g, ' ungefähr ').replace(/\?/g, ' wie viel ').replace(/○/g, ' Zeichen ').replace(/ ct/g, ' Cent').replace(/(\d+),(\d\d) €/g, '$1 Euro $2').replace(/(\d) (\d)/g, '$1$2');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t);
  u.lang = 'de-DE';
  u.rate = 0.9;
  const v = speechSynthesis.getVoices().find((x) => x.lang?.startsWith('de'));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

function setKeys(fn) {
  if (keyHandler) document.removeEventListener('keydown', keyHandler);
  keyHandler = fn;
  if (fn) document.addEventListener('keydown', fn);
}

function toast(msg) {
  $$('.toast').forEach((x) => x.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// ---------- Profile ----------
function renderProfiles() {
  setKeys(null);
  P = null;
  data.activeId = null;
  persist();
  const cards = data.profiles.map((p) => `<button class="pcard" data-id="${p.id}">${badge(WORLDS[p.world].places[0].scene)}
    <b>${esc(p.name)}</b><small>Klasse ${p.grade} · ${WORLDS[p.world].name}</small></button>`).join('');
  app.innerHTML = `<div class="title-screen">
    <h1 class="logo">Zahlenwelten</h1>
    <p class="sub">${data.profiles.length ? 'Wer spielt?' : 'Rechnen, Rätsel lösen, Welten entdecken.'}</p>
    <div class="profiles">${cards}<button class="pcard new" id="new"><span class="plus-sign">+</span><b>Neues Kind</b></button></div>
    ${data.profiles.length ? '<button class="link" id="parents">Elternbereich</button>' : ''}</div>`;
  $$('.pcard[data-id]').forEach((b) => (b.onclick = () => {
    P = data.profiles.find((p) => p.id === b.dataset.id);
    data.activeId = P.id;
    persist();
    renderMap();
  }));
  $('#new').onclick = renderNewProfile;
  $('#parents')?.addEventListener('click', renderParentGate);
}

function renderNewProfile() {
  const sel = { name: '', grade: null, world: null };
  app.innerHTML = `<header class="bar"><button class="btn round" id="back" aria-label="Zurück">←</button><h1>Neues Kind</h1></header>
    <div class="panel form">
      <label class="field">Wie heißt du?<input id="name" maxlength="16" autocomplete="off" autocapitalize="words"></label>
      <div class="field">In welche Klasse gehst du?
        <div class="choices">${[3, 4, 5, 6].map((g) => `<button class="choice grade" data-g="${g}" ${GRADES.includes(g) ? '' : 'disabled'}>${g}${GRADES.includes(g) ? '' : '<small>bald</small>'}</button>`).join('')}</div></div>
      <div class="field">Welche Welt möchtest du entdecken?
        <div class="worlds">${Object.entries(WORLDS).map(([id, w]) => `<button class="wcard" data-w="${id}">${badge(w.places[0].scene)}<b>${w.name}</b><small>${w.tagline}</small></button>`).join('')}</div></div>
      <button class="btn primary big" id="go" disabled>Los geht's!</button>
    </div>`;
  const upd = () => { $('#go').disabled = !(sel.name && sel.grade && sel.world); };
  $('#back').onclick = renderProfiles;
  $('#name').oninput = (e) => { sel.name = e.target.value.trim(); upd(); };
  $$('.grade').forEach((b) => (b.onclick = () => { sel.grade = Number(b.dataset.g); $$('.grade').forEach((x) => x.classList.toggle('on', x === b)); upd(); }));
  $$('.wcard').forEach((b) => (b.onclick = () => { sel.world = b.dataset.w; $$('.wcard').forEach((x) => x.classList.toggle('on', x === b)); upd(); }));
  $('#go').onclick = () => {
    P = newProfile(sel.name.slice(0, 16), sel.grade, sel.world);
    data.profiles.push(P);
    data.activeId = P.id;
    persist();
    renderPlacementIntro();
  };
}

// ---------- Weltkarte ----------
const rounds = (i) => P.places[world().places[i].id]?.rounds || 0;
const stars = (i) => placeStars(P.skills, topicIds(i), rounds(i));

function renderMap() {
  setKeys(null);
  const now = Date.now();
  const w = world();
  const nodes = w.places.map((pl, i) => ({
    name: pl.name, topic: TOPIC_NAMES[i], scene: pl.scene, stars: stars(i),
    locked: i > 0 && rounds(i - 1) === 0,
    due: rounds(i) > 0 && topicIds(i).some((id) => isDue(P.skills[id], now)),
  }));
  const today = P.log[dayKey(now)];
  const next = nodes.findIndex((n) => !n.locked && !n.soon && n.stars === 0);
  const tip = next >= 0 ? `Weiter geht es hier: ${w.places[next].name}.`
    : nodes.some((n) => n.due) ? 'Wo es leuchtet, wartet heute eine Wiederholung auf dich.' : 'Tippe auf einen Ort und sammle mehr Sterne.';
  app.innerHTML = `<header class="bar">
      <button class="btn round" id="switch" aria-label="Kind wechseln">←</button>
      <h1>${esc(P.name)}</h1>
      <span class="coins" id="coins" title="${SHOPS[P.world].coin}">${coinHTML(P.coins)}</span>
      <button class="btn primary" id="shop">${SHOPS[P.world].button}</button>
      <button class="btn" id="tempo">Blitzrunde</button>
      <button class="btn" id="parents">Eltern</button>
    </header>
    ${frame(mapSvg(P.world, w.name, nodes))}
    <p class="tip">${tip}${today ? ` Heute schon ${today.tasks} Aufgaben gelöst.` : ''}</p>`;
  // Gesammelte Stücke wohnen auf der Karte
  const SLOTS = [[7, 56], [33, 93], [53, 21], [60, 93], [30, 58], [8, 36], [22, 18], [46, 84], [94, 56], [95, 14]];
  const defs = [...SHOPS[P.world].items, ...SHOPS[P.world].rare];
  const mine = P.items.map((o) => ({ ...o, def: defs.find((d) => d.id === o.id) })).filter((o) => o.def).slice(-SLOTS.length);
  $('.frame-in').insertAdjacentHTML('beforeend', `<div class="critters">${mine.map((o, i) => `<button class="critter" style="left:${SLOTS[i][0]}%;top:${SLOTS[i][1]}%;animation-delay:${-i * 0.37}s" aria-label="${esc(o.name)}">${o.def.e}</button>`).join('')}</div>`);
  $$('.critter').forEach((c) => (c.onclick = () => { c.classList.remove('happy'); void c.offsetWidth; c.classList.add('happy'); tone('tick'); }));
  $('#switch').onclick = renderProfiles;
  $('#tempo').onclick = renderTempoMenu;
  $('#shop').onclick = renderShop;
  $('#parents').onclick = renderParentGate;
  $$('.node').forEach((el) => {
    const go = () => {
      const i = Number(el.dataset.i);
      if (el.classList.contains('soon')) return toast('Hier geht die Reise bald weiter.');
      if (el.classList.contains('locked')) return toast(`Schaffe zuerst eine Runde bei „${w.places[i - 1].name}“.`);
      startRound(i);
    };
    el.onclick = go;
    el.onkeydown = (e) => { if (e.key === 'Enter') go(); };
  });
}

// ---------- Einstufung ----------
function renderPlacementIntro() {
  setKeys(null);
  app.innerHTML = `<div class="panel center">
    ${badge(world().places[0].scene)}
    <h2>Hallo ${esc(P.name)}!</h2>
    <p>Bevor es losgeht, zeigst du mir, was du schon kannst. Dann bekommst du Aufgaben, die genau zu dir passen.</p>
    <p>Das ist kein Test mit Noten. Wenn du etwas nicht weißt, ist das völlig in Ordnung. Dann üben wir es später zusammen.</p>
    <div class="row-btns"><button class="btn primary big" id="go">Los geht's!</button></div>
    <button class="link dark" id="skip">Überspringen und leicht anfangen</button></div>`;
  $('#go').onclick = startPlacement;
  $('#skip').onclick = () => { P.placed = true; persist(); renderMap(); };
}

function startPlacement() {
  const reps = PLACEMENT[P.grade];
  // erst je ein Thema pro Ort, dann das zweite: so wechseln die Themen ab
  const queue = [...reps.map((p) => p[0]), ...reps.map((p) => p[1])].map((skill) => ({ skill, level: 2 }));
  session = { placement: true, pl: {}, queue, base: queue.length, idx: -1, startedAt: Date.now(), results: {}, dueAtStart: {}, done: 0, correct: 0, coins: 0, events: [], step: 0, narr: 'Zeig, was du kannst. Wenn eine Aufgabe zu schwer ist, rate einfach.' };
  app.innerHTML = `<header class="bar slim">
      <button class="btn round" id="quit" aria-label="Beenden">✕</button>
      <h1>Was kannst du schon?</h1><div class="progress" id="prog"></div><span class="coins" id="coins">${coinHTML(P.coins)}</span>
    </header>
    <main class="panel task narrow" id="panel"></main>`;
  $('#quit').onclick = () => { if (confirm('Einstufung beenden? Was du bis hier gezeigt hast, zählt.')) finishPlacement(); };
  nextTask();
}

function finishPlacement() {
  const now = Date.now();
  const s = session;
  session = null;
  setKeys(null);
  const levels = placementLevels(s.pl, PLACEMENT[P.grade], TOPICS[P.grade]);
  for (const [id, lv] of Object.entries(levels)) {
    P.skills[id].level = lv;
    P.skills[id].levelRecent = [];
  }
  P.placed = true;
  const k = dayKey(now);
  P.log[k] ||= { secs: 0, tasks: 0, correct: 0 };
  P.log[k].secs += Math.round((now - s.startedAt) / 1000);
  P.log[k].tasks += s.done;
  P.log[k].correct += s.correct;
  persist();
  tone('win');
  app.innerHTML = `<div class="panel center">
    ${badge(world().places[0].scene)}
    <h2>Danke, ${esc(P.name)}!</h2>
    <p>Jetzt weiß ich, wo wir anfangen. Manche Aufgaben werden leicht sein, andere knifflig. Genau so soll es sein.</p>
    <div class="stats"><div><b>+${s.coins}</b> <i class="coinic"></i><br><small>${SHOPS[P.world].coin}</small></div></div>
    <div class="row-btns"><button class="btn primary big" id="map">Zur Karte</button></div></div>`;
  $('#map').onclick = renderMap;
}

// ---------- Runde an einem Ort ----------
function startRound(i) {
  const now = Date.now();
  const place = world().places[i];
  const others = TOPICS[P.grade].flat();
  const plan = planRound(P.skills, topicIds(i), others, now);
  session = { i, place, queue: plan.map((skill) => ({ skill })), base: plan.length, idx: -1, startedAt: now, results: {}, dueAtStart: {}, done: 0, correct: 0, coins: 0, events: [], step: 0, starsBefore: stars(i) };
  app.innerHTML = `<header class="bar slim">
      <button class="btn round" id="quit" aria-label="Beenden">✕</button>
      <h1>${place.name}</h1><div class="progress" id="prog"></div><span class="coins" id="coins">${coinHTML(P.coins)}</span>
    </header>
    <div class="play">${frame(sceneSvg(place.scene))}<main class="panel task" id="panel"></main></div>`;
  $('#quit').onclick = () => { if (confirm('Runde abbrechen?')) finishRound(true); };
  session.narr = place.intro;
  nextTask();
}

function setStep(k, frac = k / 4) {
  const svg = $('#scene');
  if (!svg) return;
  svg.style.setProperty('--p', frac);
  for (let n = 1; n <= 4; n++) svg.classList.toggle(`p${n}`, k >= n);
}

function nextTask() {
  session.locked = false;
  session.idx += 1;
  if (session.idx >= session.queue.length) return session.placement ? finishPlacement() : finishRound(false);
  const item = session.queue[session.idx];
  const s = P.skills[item.skill];
  if (!(item.skill in session.dueAtStart)) session.dueAtStart[item.skill] = isDue(s, session.startedAt);
  session.task = generate(item.skill, item.level ?? s.level);
  session.item = item;
  session.attempt = 1;
  session.mistakes = 0;
  session.entry = '';
  session.phase = session.task.sach ? (session.task.sach.distractor !== null ? 'numbers' : 'schema') : 'answer';
  session.picked = new Set();
  renderTask();
}

function renderProgress() {
  let dots = '';
  for (let i = 0; i < session.queue.length; i++) dots += `<span class="pdot${i < session.idx ? ' done' : i === session.idx ? ' now' : ''}"></span>`;
  $('#prog').innerHTML = dots;
}

function exprHTML(t) {
  const hasLive = t.visual && (t.visual.type === 'wall' || t.visual.type === 'sequence');
  const e = esc(t.expr);
  return hasLive ? e : e.replace('?', '<span class="live-answer">?</span>');
}

function renderTask() {
  const t = session.task;
  const skill = skillById(t.skill);
  renderProgress();
  const starsTxt = '★'.repeat(t.level) + '☆'.repeat(3 - t.level);
  const body = t.sach ? sachBody(t) : `${t.text ? `<p class="task-text">${esc(t.text)}</p>` : ''}${t.visual ? renderVisual(t.visual) : ''}${t.expr ? `<div class="expr${t.expr.length > 15 ? ' long' : ''}">${exprHTML(t)}</div>` : ''}`;
  $('#panel').innerHTML = `<p class="narr">${esc(session.narr)}</p>
    <div class="task-head"><span class="skill-name">${skill.name} <span class="stars" title="Stufe ${t.level}">${starsTxt}</span></span><button class="btn small" id="speak">Vorlesen</button></div>
    <h2 class="prompt">${esc(t.prompt)}</h2>${body}
    <div id="feedback" class="feedback" aria-live="polite"></div><div id="input-area"></div>`;
  $('#speak').onclick = () => speak(t.sach ? t.sach.tokens.map((k) => k.text ?? k.num).join('') : [t.prompt, t.text, t.expr].filter(Boolean).join('. '));
  renderInput();
}

function sachBody(t) {
  const sel = session.phase === 'numbers';
  const toks = t.sach.tokens.map((k, i) => (k.text !== undefined ? esc(k.text) : `<button class="num-chip${session.picked.has(i) ? ' picked' : ''}" data-i="${i}" ${sel ? '' : 'disabled'}>${k.num}</button>`)).join('');
  const steps = t.sach.distractor !== null ? ['Zahlen finden', 'Was passiert?', 'Rechnen'] : ['Was passiert?', 'Rechnen'];
  const cur = { numbers: 'Zahlen finden', schema: 'Was passiert?', answer: 'Rechnen' }[session.phase];
  const stepper = `<ol class="stepper">${steps.map((s) => `<li class="${s === cur ? 'now' : steps.indexOf(s) < steps.indexOf(cur) ? 'done' : ''}">${s}</li>`).join('')}</ol>`;
  const ask = {
    numbers: '<p class="ask">Tippe die Zahlen an, die du für die Frage brauchst.</p>',
    schema: '<p class="ask">Was passiert in der Geschichte?</p>',
    answer: `<p class="ask">Rechne jetzt: ${t.sach.needed[0]} ${SCHEMAS[t.sach.schema].op} ${t.sach.needed[1]} = <span class="live-answer">?</span> ${esc(t.unit)}</p>`,
  }[session.phase];
  return `${stepper}<p class="story">${toks}</p>${ask}`;
}

function renderInput() {
  const t = session.task;
  const area = $('#input-area');
  if (t.sach && session.phase === 'numbers') {
    $$('.num-chip').forEach((b) => (b.onclick = () => {
      const i = Number(b.dataset.i);
      session.picked.has(i) ? session.picked.delete(i) : session.picked.add(i);
      b.classList.toggle('picked');
    }));
    area.innerHTML = '<button class="btn primary big" id="ok">Fertig</button>';
    $('#ok').onclick = submitNumbers;
    return setKeys((e) => { if (e.key === 'Enter') submitNumbers(); });
  }
  if (t.sach && session.phase === 'schema') {
    area.innerHTML = `<div class="choices col">${t.sach.schemaChoices.map((c) => `<button class="choice" data-v="${c.value}">${esc(c.label.replace(/^\S+\s/, ''))}</button>`).join('')}</div>`;
    $$('.choice', area).forEach((b) => (b.onclick = () => submitSchema(b)));
    return setKeys(null);
  }
  if (t.input === 'choice') {
    area.innerHTML = `<div class="choices">${t.choices.map((c) => `<button class="choice sign" data-v="${esc(c.value)}">${esc(c.label)}</button>`).join('')}</div>`;
    $$('.choice', area).forEach((b) => (b.onclick = () => submitAnswer(b.dataset.v, b)));
    return setKeys((e) => { const c = t.choices.find((x) => x.value === e.key); if (c) submitAnswer(c.value, area.querySelector(`[data-v="${CSS.escape(c.value)}"]`)); });
  }
  if (t.input === 'tapline') {
    session.sel = null;
    $$('.tick').forEach((x) => x.classList.remove('sel'));
    area.innerHTML = '<button class="btn primary big" id="ok" disabled>Prüfen</button>';
    $$('.tick').forEach((g) => (g.onclick = () => {
      if (session.locked) return;
      session.sel = Number(g.dataset.v);
      $$('.tick').forEach((x) => x.classList.toggle('sel', x === g));
      $('#ok').disabled = false;
    }));
    $('#ok').onclick = () => submitAnswer(session.sel);
    return setKeys((e) => { if (e.key === 'Enter' && session.sel !== null) submitAnswer(session.sel); });
  }
  if (t.input === 'order') {
    session.sel = [];
    const draw = () => {
      const full = session.sel.length === t.items.length;
      area.innerHTML = `<div class="slots">${t.items.map((_, i) => `<span class="slot${session.sel[i] !== undefined ? ' full' : ''}">${session.sel[i] !== undefined ? fmt(session.sel[i]) : ''}</span>`).join(`<span class="lt">${t.desc ? '>' : '<'}</span>`)}</div>
        <div class="tablets">${t.items.map((v) => `<button class="tablet" data-v="${v}" ${session.sel.includes(v) ? 'disabled' : ''}>${fmt(v)}</button>`).join('')}</div>
        <div class="row-btns"><button class="btn" id="undo" ${session.sel.length ? '' : 'disabled'}>Zurück</button><button class="btn primary big" id="ok" ${full ? '' : 'disabled'}>Prüfen</button></div>`;
      $$('.tablet', area).forEach((b) => (b.onclick = () => { if (session.locked) return; session.sel.push(Number(b.dataset.v)); tone('tick'); draw(); }));
      $('#undo').onclick = () => { if (session.locked) return; session.sel.pop(); draw(); };
      $('#ok').onclick = () => submitAnswer([...session.sel]);
    };
    draw();
    return setKeys((e) => { if (e.key === 'Enter' && session.sel.length === t.items.length) submitAnswer([...session.sel]); });
  }
  if (t.input === 'coins') {
    session.sel = [];
    const lab = (d) => (d >= 100 ? `${d / 100} €` : `${d} ct`);
    const cls = (d) => (d >= 500 ? 'note' : d >= 100 ? 'coin gold big' : d >= 10 ? 'coin gold' : 'coin copper');
    const draw = () => {
      area.innerHTML = `<div class="tray money">${session.sel.map((d, i) => `<button class="${cls(d)}" data-i="${i}" aria-label="${lab(d)} wegnehmen">${lab(d)}</button>`).join('')}</div>
        <div class="purse money">${t.denoms.map((d) => `<button class="${cls(d)}" data-d="${d}">${lab(d)}</button>`).join('')}</div>
        <button class="btn primary big" id="ok" ${session.sel.length ? '' : 'disabled'}>Prüfen</button>`;
      $$('.purse button', area).forEach((b) => (b.onclick = () => { if (session.locked || session.sel.length >= 14) return; session.sel.push(Number(b.dataset.d)); tone('tick'); draw(); }));
      $$('.tray button', area).forEach((b) => (b.onclick = () => { if (session.locked) return; session.sel.splice(Number(b.dataset.i), 1); draw(); }));
      $('#ok').onclick = () => submitAnswer(session.sel.reduce((a, b) => a + b, 0));
    };
    draw();
    return setKeys(null);
  }
  const money = t.input === 'money';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', money ? ',' : '', '0', '⌫'];
  area.innerHTML = `<div class="answer-row"><div class="display" id="display">&nbsp;</div>${money ? '<span class="unit">€</span>' : t.unit ? `<span class="unit">${esc(t.unit)}</span>` : ''}</div>
    <div class="keypad">${keys.map((k) => (k ? `<button class="key" data-k="${k}">${k}</button>` : '<span></span>')).join('')}</div>
    <button class="btn primary big" id="ok">Prüfen</button>`;
  $$('.key', area).forEach((b) => (b.onclick = () => press(b.dataset.k)));
  $('#ok').onclick = () => submitAnswer(session.entry);
  setKeys((e) => {
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('⌫');
    else if ((e.key === ',' || e.key === '.') && money) press(',');
    else if (e.key === 'Enter') submitAnswer(session.entry);
  });
}

function press(k) {
  if (session.locked) return;
  if (k === '⌫') session.entry = session.entry.slice(0, -1);
  else if (k === ',' && session.entry.includes(',')) return;
  else if (session.entry.length < 7) session.entry += k;
  const d = $('#display');
  if (d) d.innerHTML = session.entry || '&nbsp;';
  $$('.live-answer').forEach((el) => (el.textContent = session.entry || '?'));
}

function feedback(html, cls) {
  const f = $('#feedback');
  f.className = `feedback ${cls}`;
  f.innerHTML = html;
  // Nach einer Hilfe mit Bild die Eingabe wieder ins Blickfeld holen
  if (cls === 'hint') requestAnimationFrame(() => $('#input-area')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
}

function submitNumbers() {
  const t = session.task;
  const nums = [...session.picked].map((i) => t.sach.tokens[i].num);
  if (nums.length === 2 && t.sach.needed.every((n) => nums.includes(n))) {
    tone('ok');
    session.phase = 'schema';
    renderTask();
    return feedback(`Richtig! Die Zahl ${t.sach.distractor} braucht man für die Frage nicht.`, 'good');
  }
  session.mistakes += 1;
  tone('bad');
  if (session.mistakes >= 2) {
    session.picked = new Set(t.sach.tokens.map((k, i) => (k.role && k.role !== 'd' ? i : -1)).filter((i) => i >= 0));
    session.phase = 'schema';
    renderTask();
    return feedback(`Man braucht ${t.sach.needed.join(' und ')}. Die Zahl ${t.sach.distractor} hat mit der Frage nichts zu tun.`, 'hint');
  }
  feedback('Nicht ganz. Lies die Frage am Ende nochmal: Welche Zahlen braucht man wirklich? Eine Zahl ist eine Falle!', 'hint');
}

function submitSchema(btn) {
  const t = session.task;
  if (btn.dataset.v === t.sach.schema) {
    tone('ok');
    session.phase = 'answer';
    renderTask();
    return feedback(`Genau: ${SCHEMAS[t.sach.schema].label}.`, 'good');
  }
  session.mistakes += 1;
  tone('bad');
  btn.classList.add('wrong');
  btn.disabled = true;
  const tips = {
    dazu: 'Achte auf Wörter wie „dazu“, „zusammen“, „insgesamt“.',
    weg: 'Achte auf Wörter wie „übrig“, „bleiben“, „noch“, „fressen“.',
    vergleich: 'Achte auf Wörter wie „mehr“, „größer“, „weniger“.',
    mal: 'Achte auf „in jedem“ oder „je“: gleich viele in jeder Gruppe.',
    teilen: 'Achte auf „gerecht verteilt“ oder „Gruppen mit je“.',
  };
  feedback(`Nicht ganz. ${tips[t.sach.schema]}`, 'hint');
}

function submitAnswer(given, btn) {
  if (session.locked) return;
  const t = session.task;
  if ((t.input === 'number' || t.input === 'money') && String(given).trim() === '') return;
  const special = ['tapline', 'order', 'coins'].includes(t.input);
  if (check(t, given)) {
    const firstTry = session.attempt === 1 && session.mistakes === 0;
    btn?.classList.add('right');
    const moved = finishTask(firstTry);
    tone(moved ? 'gear' : 'ok');
    feedback(`<b>${pick(Math.random, firstTry ? PRAISE : PRAISE_RETRY)}</b> <span class="plus">+${session.lastCoins}<i class="coinic"></i></span>${session.combo >= 3 ? ` <span class="combo">${session.combo}er-Serie!</span>` : ''}${t.sach ? `<br>${esc(t.sach.answerSentence)}` : ''}`, 'good');
    cheer(true);
    if (session.combo === 5 || session.combo === 10) { tone('win'); toast(`${session.combo} Aufgaben in Folge gleich richtig!`); }
    return showNext();
  }
  tone('bad');
  cheer(false);
  btn?.classList.add('wrong');
  if (session.attempt === 1 && !session.placement) {
    session.attempt = 2;
    session.entry = '';
    const laid = t.input === 'coins' ? `Du hast ${euro(given)} gelegt. ` : '';
    if (special) renderInput(); else press('');
    return feedback(`<b>Fast!</b> ${laid}${esc(t.hint.text)}${t.hint.visual ? renderVisual(t.hint.visual) : ''}<br>Versuch es nochmal.`, 'hint');
  }
  finishTask(false, false);
  const correct = t.input === 'money' || t.input === 'coins' ? euro(t.answer) : t.input === 'choice' ? t.answer : t.input === 'order' ? t.answer.map(fmt).join(t.desc ? ' > ' : ' < ') : fmt(t.answer);
  if (t.input === 'tapline') $$('.tick').forEach((x) => x.classList.toggle('sel', Number(x.dataset.v) === t.answer));
  feedback(session.placement
    ? `Das ist noch neu für dich. Kein Problem, das üben wir zusammen!<br><small>Richtig wäre: ${esc(correct)}</small>`
    : `Richtig ist: <b>${esc(correct)}</b><br>So geht's: ${esc(t.solution)}<br><small>${pick(Math.random, ENCOURAGE)}</small>`, 'show');
  showNext();
}

// Verbucht die Aufgabe. Gibt true zurück, wenn sich die Szene einen Schritt weiterbewegt hat.
function finishTask(firstTry, solved = true) {
  const t = session.task;
  const now = Date.now();
  session.locked = true;
  session.done += 1;
  if (firstTry) session.correct += 1;
  (session.results[t.skill] ||= []).push(firstTry);
  session.lastCoins = coinsFor({ firstTry, solved, level: t.level, wasDue: session.dueAtStart[t.skill] });
  session.coins += session.lastCoins;
  addCoins(session.lastCoins);
  session.combo = firstTry ? (session.combo || 0) + 1 : 0;
  if (session.combo >= 3) { session.lastCoins += 1; session.coins += 1; addCoins(1); }
  if (session.placement) {
    (session.pl[t.skill] ||= {})[`r${t.level}`] = firstTry;
    if (t.level === 2 && firstTry) session.queue.splice(session.idx + 1, 0, { skill: t.skill, level: 3 });
    persist();
    return false;
  }
  const ev = recordAnswer(P.skills[t.skill], firstTry, now);
  if (ev === 'levelUp') session.events.push(`${skillById(t.skill).name}: jetzt Stufe ${'★'.repeat(P.skills[t.skill].level)}`);
  if (ev === 'mastered') session.events.push(`${skillById(t.skill).name} hast du gemeistert!`);
  // Nicht auf Anhieb gelöst: eine ähnliche Aufgabe kommt etwas später nochmal
  if (!firstTry && !session.item.retry) session.queue.splice(Math.min(session.idx + 4, session.queue.length), 0, { skill: t.skill, retry: true });
  persist();
  const frac = Math.min(0.92, session.done / session.base);
  const step = Math.min(3, Math.floor(4 * frac + 0.001));
  setStep(step, frac);
  if (step > session.step) {
    session.step = step;
    session.narr = session.place.steps[step - 1];
    const n = $('.narr');
    if (n) { n.textContent = session.narr; n.classList.remove('flash'); void n.offsetWidth; n.classList.add('flash'); }
    return true;
  }
  return false;
}

function showNext() {
  $('#input-area').innerHTML = '<button class="btn primary big" id="next">Weiter</button>';
  $('#next').onclick = nextTask;
  setKeys((e) => { if (e.key === 'Enter') nextTask(); });
}

function finishRound(aborted) {
  const now = Date.now();
  const s = session;
  session = null;
  setKeys(null);
  for (const [id, res] of Object.entries(s.results)) scheduleAfterSession(P.skills[id], res, now, s.dueAtStart[id]);
  const k = dayKey(now);
  P.log[k] ||= { secs: 0, tasks: 0, correct: 0 };
  P.log[k].secs += Math.round((now - s.startedAt) / 1000);
  P.log[k].tasks += s.done;
  P.log[k].correct += s.correct;
  if (!aborted) {
    P.places[s.place.id] ||= { rounds: 0 };
    P.places[s.place.id].rounds += 1;
  }
  persist();
  if (aborted) return renderMap();
  setStep(4);
  tone('win');
  const st = stars(s.i);
  const bonus = 5 + (st > s.starsBefore ? 10 : 0);
  addCoins(bonus);
  persist();
  const firstTime = P.places[s.place.id].rounds === 1;
  const nextPlace = world().places[s.i + 1];
  const news = [];
  if (st > s.starsBefore) news.push(`Neuer Stern für „${s.place.name}“!`);
  if (firstTime && nextPlace) news.push(`Neuer Ort auf der Karte: ${nextPlace.name}`);
  news.push(...s.events);
  $('#prog').innerHTML = '';
  $('#panel').innerHTML = `<div class="summary">
    <p class="narr flash">${esc(s.place.done)}</p>
    <div class="bigstars">${[0, 1, 2].map((n) => `<span class="${n < st ? 'on' : ''}">★</span>`).join('')}</div>
    <div class="stats"><div><b>${s.correct}</b> von ${s.done}<br><small>gleich richtig</small></div><div><b>+${s.coins + bonus}</b> <i class="coinic"></i><br><small>${s.coins} fürs Rechnen, ${bonus} Bonus</small></div></div>
    ${news.length ? `<ul class="events">${news.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
    ${st < 3 ? `<p class="hintline">${st < 2 ? 'Den zweiten Stern gibt es, wenn alle Themen hier auf Stufe ★★ sind.' : 'Den dritten Stern gibt es, wenn du alle Themen hier gemeistert hast.'}</p>` : ''}
    <div class="chestbox"><button class="chest" id="chest" aria-label="Schatzkiste öffnen">${CHEST}</button><p id="chesttxt">Eine Schatzkiste! Tippe sie an.</p></div>
    <div class="row-btns"><button class="btn primary big" id="map">Zur Karte</button><button class="btn big" id="toshop">${SHOPS[P.world].button}</button><button class="btn big" id="again">Noch eine Runde</button></div></div>`;
  $('#chest').onclick = openChest;
  $('#toshop').onclick = renderShop;
  $('#map').onclick = renderMap;
  $('#again').onclick = () => startRound(s.i);
  $('#quit').onclick = renderMap;
}

// ---------- Effekte: Jubel, fliegende Münzen, Schatzkiste ----------
const CHEST = `<svg viewBox="0 0 120 100" class="chestsvg" aria-hidden="true"><g class="art" filter="url(#wob2)">
  <circle class="shine" cx="60" cy="42" r="40" fill="url(#gold)" stroke="none"/>
  <g class="lid"><path d="M14 46 Q14 14 60 14 Q106 14 106 46Z" fill="#a8703a"/><path d="M40 17 V46 M80 17 V46" stroke-width="5" stroke="#c9a24a"/></g>
  <path d="M14 46 H106 V90 H14Z" fill="#8a6a3c"/><path d="M40 46 V90 M80 46 V90" stroke-width="5" stroke="#c9a24a"/><rect x="52" y="40" width="16" height="18" rx="3" fill="#c9a24a"/></g></svg>`;

function cheer(ok) {
  const hero = $('#scene .hero');
  if (hero) { hero.classList.remove('cheer', 'sad'); void hero.getBoundingClientRect(); hero.classList.add(ok ? 'cheer' : 'sad'); }
  if (!ok) return;
  const to = $('#coins')?.getBoundingClientRect();
  const from = ($('#feedback') || $('#panel'))?.getBoundingClientRect();
  if (!to || !from || !document.body.animate) return;
  const n = Math.min(6, session?.lastCoins || 2);
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = 'coinic fly';
    const x0 = from.left + from.width / 2 + (Math.random() * 90 - 45), y0 = from.top + 12;
    c.style.left = `${x0}px`;
    c.style.top = `${y0}px`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2500); // Sicherheitsnetz, falls die Animation pausiert wird
    const dx = to.left + 8 - x0, dy = to.top + 6 - y0;
    c.animate([
      { transform: 'translate(0, 0) scale(1.5)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 70}px) scale(1.3)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.7)`, opacity: 0.7 },
    ], { duration: 620 + i * 80, delay: i * 70, easing: 'ease-in', fill: 'backwards' }).onfinish = () => {
      c.remove();
      const el = $('#coins');
      if (el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    };
  }
}

function openChest() {
  const el = $('#chest');
  if (!el || el.classList.contains('open')) return;
  const shop = SHOPS[P.world];
  const missing = shop.rare.filter((r) => !P.items.some((o) => o.id === r.id));
  const first = !P.chests;
  P.chests = (P.chests || 0) + 1;
  let html;
  // Die erste Kiste enthält immer ein seltenes Stück, danach etwa jede dritte
  if (missing.length && (first || Math.random() < 0.3)) {
    const r = pick(Math.random, missing);
    P.items.push({ uid: `${r.id}-${Date.now().toString(36)}`, id: r.id, name: r.name });
    html = `<span class="em">${r.e}</span><b>Ein seltenes Stück: ${r.name}!</b>`;
    tone('win');
  } else {
    const c = int(Math.random, 6, 15);
    addCoins(c);
    html = `<b>+${c}</b> <i class="coinic"></i> ${shop.coin}`;
    tone('tick');
  }
  persist();
  el.classList.add('open');
  const t = $('#chesttxt');
  t.innerHTML = html;
  t.classList.add('prize');
}

// ---------- Münzen und Sammlung ----------
const coinHTML = (n) => `<i class="coinic"></i><b>${n}</b>`;

function addCoins(n) {
  P.coins += n;
  P.coinsTotal += n;
  const el = $('#coins');
  if (el) el.innerHTML = coinHTML(P.coins);
}

function renderShop() {
  setKeys(null);
  const shop = SHOPS[P.world];
  const owned = P.items.map((o) => ({ ...o, def: [...shop.items, ...shop.rare].find((x) => x.id === o.id) })).filter((o) => o.def);
  const card = (i) => {
    const n = P.items.filter((o) => o.id === i.id).length;
    return `<button class="sticker buy" data-id="${i.id}" ${P.coins >= i.price ? '' : 'disabled'}><span class="em">${i.e}</span><small>${i.name}</small><span class="price">${coinHTML(i.price)}</span>${n ? `<span class="have">×${n}</span>` : ''}</button>`;
  };
  app.innerHTML = `<header class="bar"><button class="btn round" id="back" aria-label="Zurück">←</button><h1>${shop.title}</h1><span class="coins" id="coins" title="${shop.coin}">${coinHTML(P.coins)}</span></header>
    <div class="panel album">
      <h2>${shop.mine}</h2>
      <div class="stickers">${owned.length ? owned.map((o) => `<button class="sticker own" data-uid="${o.uid}"><span class="em">${o.def.e}</span><small>${esc(o.name)}</small></button>`).join('') : `<p class="hintline">${shop.empty}</p>`}</div>
      ${owned.length ? `<p class="hintline">${shop.tip}</p>` : ''}
      <p class="narr">${shop.coin} verdienst du beim Rechnen: 2 für jede Aufgabe, die gleich stimmt, mehr für schwere Aufgaben und Wiederholungen. Für jede geschaffte Runde gibt es 5 dazu.</p>
      <h3>Seltene Stücke aus der Schatzkiste</h3>
      <div class="stickers">${shop.rare.map((r) => (P.items.some((o) => o.id === r.id) ? `<div class="sticker rare"><span class="em">${r.e}</span><small>${r.name}</small></div>` : '<div class="sticker rare unknown"><span class="em">?</span><small>noch geheim</small></div>')).join('')}</div>
      ${shop.groups.map((g) => `<h3>${g.name}</h3><div class="stickers">${shop.items.filter((i) => i.g === g.id).map(card).join('')}</div>`).join('')}
    </div>`;
  $('#back').onclick = renderMap;
  $$('.sticker.buy').forEach((b) => (b.onclick = () => {
    const def = shop.items.find((x) => x.id === b.dataset.id);
    if (!def || P.coins < def.price) return;
    const n = P.items.filter((o) => o.id === def.id).length;
    P.coins -= def.price;
    P.items.push({ uid: `${def.id}-${Date.now().toString(36)}`, id: def.id, name: n ? `${def.name} ${n + 1}` : def.name });
    persist();
    tone('win');
    renderShop();
    toast(`${def.e} ${def.name} ${shop.moved}`);
  }));
  $$('.sticker.own').forEach((el) => {
    let timer = null, long = false;
    const start = () => { long = false; timer = setTimeout(() => { long = true; renameItem(el.dataset.uid); }, 650); };
    const end = () => clearTimeout(timer);
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointerleave', end);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('click', () => {
      if (long) return;
      el.classList.remove('happy');
      void el.offsetWidth;
      el.classList.add('happy');
      const t = document.createElement('span');
      t.className = 'treat';
      t.textContent = pick(Math.random, shop.treats);
      el.appendChild(t);
      setTimeout(() => t.remove(), 900);
      tone('tick');
    });
  });
}

function renameItem(uid) {
  const o = P.items.find((x) => x.uid === uid);
  if (!o) return;
  const name = prompt('Wie soll es heißen?', o.name);
  if (!name || !name.trim()) return;
  o.name = name.trim().slice(0, 16);
  persist();
  renderShop();
}

// ---------- Blitzrunde (Kopfrechnen auf Zeit, nur gegen den eigenen Rekord) ----------
function renderTempoMenu() {
  setKeys(null);
  app.innerHTML = `<header class="bar"><button class="btn round" id="back" aria-label="Zurück">←</button><h1>Blitzrunde</h1></header>
    <div class="panel center">
      <p>Eine Minute. Wie viele schaffst du? Du trittst nur gegen <b>deinen eigenen Rekord</b> an.</p>
      <div class="row-btns">
        <button class="btn primary big" data-m="einmaleins">Einmaleins<small>Rekord: ${P.tempoBest.einmaleins}</small></button>
        <button class="btn primary big" data-m="plusminus">Plus & Minus<small>Rekord: ${P.tempoBest.plusminus}</small></button>
      </div>
      <p class="hintline">Lieber richtig als schnell. Falsche Antworten kosten nichts, zählen aber nicht.</p>
    </div>`;
  $('#back').onclick = renderMap;
  $$('[data-m]').forEach((b) => (b.onclick = () => startTempo(b.dataset.m)));
}

function tempoTask(mode) {
  if (mode === 'einmaleins') return generate('einmaleins', int(Math.random, 1, P.grade >= 4 ? 3 : P.skills.einmaleins.level));
  if (P.grade >= 4) return generate(pick(Math.random, ['plus_mit', 'minus_mit', 'g4_plus', 'g4_minus']), 1);
  return generate(pick(Math.random, ['plus_ohne', 'minus_ohne']), int(Math.random, 1, 2));
}

function startTempo(mode) {
  tempo = { mode, correct: 0, end: Date.now() + 60000, entry: '', task: tempoTask(mode) };
  app.innerHTML = `<header class="bar slim"><button class="btn round" id="quit" aria-label="Beenden">✕</button><div class="timer"><div id="bar"></div></div><div class="count">✓ <b id="cnt">0</b></div></header>
    <main class="panel task narrow">
      <div class="expr big" id="texpr"></div>
      <div class="answer-row"><div class="display" id="display">&nbsp;</div></div>
      <div class="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k) => (k ? `<button class="key" data-k="${k}">${k}</button>` : '<span></span>')).join('')}</div>
      <button class="btn primary big" id="ok">OK</button>
    </main>`;
  const show = () => { $('#texpr').innerHTML = esc(tempo.task.expr).replace('?', '<span class="live-answer">?</span>'); $('#display').innerHTML = '&nbsp;'; };
  const upd = () => { $('#display').innerHTML = tempo.entry || '&nbsp;'; $('.live-answer').textContent = tempo.entry || '?'; };
  const tpress = (k) => { if (k === '⌫') tempo.entry = tempo.entry.slice(0, -1); else if (tempo.entry.length < 6) tempo.entry += k; upd(); };
  const submit = () => {
    if (!tempo.entry) return;
    if (check(tempo.task, tempo.entry)) { tempo.correct += 1; tone('tick'); $('#cnt').textContent = tempo.correct; }
    else { tone('bad'); $('#texpr').classList.add('shake'); setTimeout(() => $('#texpr')?.classList.remove('shake'), 400); }
    tempo.entry = '';
    tempo.task = tempoTask(mode);
    show();
  };
  $$('.key').forEach((b) => (b.onclick = () => tpress(b.dataset.k)));
  $('#ok').onclick = submit;
  $('#quit').onclick = () => { clearInterval(tempo.timer); tempo = null; renderTempoMenu(); };
  setKeys((e) => { if (/^[0-9]$/.test(e.key)) tpress(e.key); else if (e.key === 'Backspace') tpress('⌫'); else if (e.key === 'Enter') submit(); });
  show();
  tempo.timer = setInterval(() => {
    const left = tempo.end - Date.now();
    const bar = $('#bar');
    if (bar) bar.style.width = `${Math.max(0, left / 600)}%`;
    if (left <= 0) endTempo();
  }, 100);
}

function endTempo() {
  clearInterval(tempo.timer);
  const t = tempo;
  tempo = null;
  setKeys(null);
  const old = P.tempoBest[t.mode];
  const record = t.correct > old;
  if (record) P.tempoBest[t.mode] = t.correct;
  const coins = Math.floor(t.correct / 3) + (record ? 3 : 0);
  addCoins(coins);
  persist();
  if (record) tone('win');
  app.innerHTML = `<div class="panel center">
    <h2>${record ? 'Neuer Rekord!' : 'Zeit ist um!'}</h2>
    <div class="stats"><div><b>${t.correct}</b><br><small>richtig</small></div><div><b>${old}</b><br><small>alter Rekord</small></div><div><b>+${coins}</b> <i class="coinic"></i></div></div>
    ${!record && t.correct > 0 ? `<p>${t.correct >= old - 2 ? 'Ganz knapp dran!' : 'Mit jedem Üben wirst du schneller.'}</p>` : ''}
    <div class="row-btns"><button class="btn primary big" id="again">Nochmal</button><button class="btn big" id="home">Zur Karte</button></div></div>`;
  $('#again').onclick = () => startTempo(t.mode);
  $('#home').onclick = renderMap;
}

// ---------- Elternbereich ----------
function renderParentGate() {
  setKeys(null);
  const a = int(Math.random, 13, 19), b = int(Math.random, 4, 9);
  const back = P ? renderMap : renderProfiles;
  app.innerHTML = `<header class="bar"><button class="btn round" id="back" aria-label="Zurück">←</button><h1>Elternbereich</h1></header>
    <div class="panel center"><p>Nur für Erwachsene. Wie viel ist</p><div class="expr">${a} · ${b} = ?</div>
      <input id="gate" inputmode="numeric" autocomplete="off" class="gate-input"><br><button class="btn primary big" id="ok">Öffnen</button></div>`;
  $('#back').onclick = back;
  const go = () => (Number($('#gate').value) === a * b ? renderParents(P?.id || data.profiles[0]?.id) : ($('#gate').value = ''));
  $('#ok').onclick = go;
  $('#gate').addEventListener('keydown', (e) => e.key === 'Enter' && go());
  $('#gate').focus();
}

const fmtDate = (ts) => (ts ? new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '–');

function renderParents(viewId) {
  setKeys(null);
  const now = Date.now();
  const V = data.profiles.find((p) => p.id === viewId);
  const back = P ? renderMap : renderProfiles;
  let body = '<p>Noch kein Kind angelegt.</p>';
  if (V) {
    const w = WORLDS[V.world];
    const rows = TOPICS[V.grade].map((ids, i) => `<tr class="grp-row"><th colspan="6">${TOPIC_NAMES[i]} · ${w.places[i].name} (${V.places[w.places[i].id]?.rounds || 0} Runden)</th></tr>${ids.map((id) => {
      const s = V.skills[id];
      const acc = accuracy(s);
      const cls = acc === null ? '' : acc >= 0.8 ? 'good' : acc >= 0.6 ? 'mid' : 'bad';
      return `<tr><td>${skillById(id).name}</td><td class="stars">${'★'.repeat(s.level)}${'☆'.repeat(3 - s.level)}${s.mastered ? ' ✓' : ''}</td>
        <td class="${cls}">${acc === null ? '–' : `${Math.round(acc * 100)} %`}</td><td>${s.attempts}</td><td>${fmtDate(s.lastSeen)}</td><td>${s.attempts === 0 ? 'neu' : s.due <= now ? 'jetzt' : fmtDate(s.due)}</td></tr>`;
    }).join('')}`).join('');
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const l = V.log[dayKey(now - i * DAY)] || { secs: 0 };
      days.push({ label: new Date(now - i * DAY).toLocaleDateString('de-DE', { weekday: 'short' }), min: l.secs / 60 });
    }
    const max = Math.max(10, ...days.map((d) => d.min));
    const weak = TOPICS[V.grade].flat().filter((id) => { const a = accuracy(V.skills[id]); return a !== null && V.skills[id].recent.length >= 5 && a < 0.7; }).map((id) => skillById(id).name);
    body = `
      <p>${V.coinsTotal} Münzen insgesamt verdient, ${V.items.length} Stücke in der Sammlung.</p>
      ${weak.length ? `<p class="warn">Hier hakt es gerade (unter 70 % richtig): <b>${weak.join(', ')}</b></p>` : ''}
      <h3>Übungszeit der letzten 7 Tage</h3>
      <div class="chart">${days.map((d) => `<div class="bar-col"><div class="cbar" style="height:${(d.min / max) * 100}%"></div><small>${Math.round(d.min)}′</small><span>${d.label}</span></div>`).join('')}</div>
      <h3>Themen</h3>
      <div class="table-wrap"><table class="skills"><tr><th>Thema</th><th>Stufe</th><th>Treffer*</th><th>Aufgaben</th><th>Zuletzt</th><th>Wiederholen</th></tr>${rows}</table></div>
      <p class="hintline">* Anteil „beim ersten Versuch richtig“ bei den letzten 20 Aufgaben. Ziel sind etwa 80 %. Die Stufe passt sich automatisch an. ✓ = gemeistert.</p>
      <h3>Profil</h3>
      <label class="set">Name <input id="pname" value="${esc(V.name)}" maxlength="16"></label>
      <label class="set">Klasse <select id="pgrade">${GRADES.map((g) => `<option ${V.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
      <label class="set">Welt <select id="pworld">${Object.entries(WORLDS).map(([id, x]) => `<option value="${id}" ${V.world === id ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
      <div class="row-btns"><button class="btn" id="pplace">Einstufung ${V.placed ? 'wiederholen' : 'starten'}</button><button class="btn danger" id="pdel">Dieses Profil löschen</button></div>
      <p class="hintline">Die Einstufung dauert etwa 5 Minuten und setzt die Stufen aller Themen neu. Der übrige Lernstand bleibt erhalten.</p>`;
  }
  app.innerHTML = `<header class="bar"><button class="btn round" id="back" aria-label="Zurück">←</button><h1>Elternbereich</h1></header>
    <div class="panel parents">
      <div class="tabs">${data.profiles.map((p) => `<button class="btn${p.id === viewId ? ' on' : ''}" data-v="${p.id}">${esc(p.name)} · Klasse ${p.grade}</button>`).join('')}</div>
      ${body}
      <h3>Allgemein</h3>
      <label class="set"><input type="checkbox" id="sound" ${data.settings.sound ? 'checked' : ''}> Töne an</label>
      <p class="hintline">Die Spielstände liegen nur auf diesem Gerät. Wenn in Safari die Website-Daten gelöscht werden, sind sie weg. Sichere sie ab und zu als Datei, zum Beispiel in iCloud Drive.</p>
      <div class="row-btns"><button class="btn" id="export">Spielstände sichern</button><label class="btn file">Wiederherstellen<input type="file" id="import" accept="application/json,.json" hidden></label></div>
    </div>`;
  $('#back').onclick = back;
  $$('.tabs .btn').forEach((b) => (b.onclick = () => renderParents(b.dataset.v)));
  $('#sound').onchange = (e) => { data.settings.sound = e.target.checked; persist(); };
  $('#export').onclick = () => exportFile(data);
  $('#import').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const d = await importFile(f);
      if (!confirm('Alle aktuellen Spielstände durch die Datei ersetzen?')) return;
      data = d;
      P = null;
      persist();
      toast('Spielstände wiederhergestellt.');
      renderProfiles();
    } catch (err) { alert(err.message); }
  };
  if (!V) return;
  $('#pname').onchange = (e) => { V.name = e.target.value.trim().slice(0, 16) || V.name; persist(); renderParents(viewId); };
  $('#pgrade').onchange = (e) => { V.grade = Number(e.target.value); persist(); renderParents(viewId); };
  $('#pworld').onchange = (e) => { V.world = e.target.value; persist(); renderParents(viewId); };
  $('#pplace').onclick = () => { P = V; data.activeId = V.id; persist(); renderPlacementIntro(); };
  $('#pdel').onclick = () => {
    if (!confirm(`Das Profil „${V.name}“ wirklich löschen? Der Lernstand ist dann weg.`)) return;
    if (!confirm('Ganz sicher? Das lässt sich nur mit einer gesicherten Datei rückgängig machen.')) return;
    data.profiles = data.profiles.filter((p) => p.id !== V.id);
    if (P?.id === V.id) { P = null; data.activeId = null; }
    persist();
    data.profiles.length ? renderParents(data.profiles[0].id) : renderProfiles();
  };
}

// ---------- Start ----------
P ? renderMap() : renderProfiles();

// Nur für automatische Tests (Adresse mit #test): Zugriff auf die laufende Runde
if (location.hash === '#test') window.__zw = { get session() { return session; }, get data() { return data; }, get P() { return P; } };

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
if ('speechSynthesis' in window) speechSynthesis.getVoices();
