import { SKILLS, GROUPS, SCHEMAS, generate, check, euro, skillById, pick, int } from './tasks.js';
import { recordAnswer, scheduleAfterSession, planSession, PLACEMENT_SKILLS, placementLevel, coinsFor, accuracy, dayKey, DAY } from './learner.js';
import { load, save, exportFile, importFile, freshState } from './store.js';
import { HABITATS, ANIMALS, MASTER_ANIMALS, animalById, PRAISE, PRAISE_RETRY, ENCOURAGE } from './zoo.js';
import { renderVisual } from './visuals.js';

const $ = (sel, root = document) => root.querySelector(sel);
const app = $('#app');
let state = load();
let session = null;
let tempo = null;
let keyHandler = null;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const persist = () => save(state);

// ---------- Ton & Sprache ----------
let audio;
function tone(kind) {
  if (!state.settings.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const notes = { ok: [523, 659, 784], bad: [330, 262], coin: [880, 1175], buy: [523, 784, 1047, 1319] }[kind];
    notes.forEach((f, i) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = kind === 'bad' ? 'triangle' : 'sine';
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
  const t = text.replace(/·/g, ' mal ').replace(/ : /g, ' geteilt durch ').replace(/−/g, ' minus ').replace(/\?/g, ' wie viel ').replace(/○/g, ' Zeichen ').replace(/ ct/g, ' Cent').replace(/(\d+),(\d\d) €/g, '$1 Euro $2');
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

// ---------- Startseite / Zoo ----------
function animalHTML(a, extraCls = '') {
  return `<button class="animal ${extraCls}" data-uid="${esc(a.uid)}" aria-label="${esc(a.name)}"><span class="ae">${a.e}</span><span class="an">${esc(a.name)}</span></button>`;
}

function renderHome() {
  setKeys(null);
  const owned = state.animals.map((a) => ({ ...a, e: animalById(a.id)?.e || '❓' }));
  const habitats = HABITATS.map((h) => {
    const list = owned.filter((a) => animalById(a.id)?.h === h.id);
    return `<section class="habitat" style="--bg:${h.bg};--bd:${h.border}">
      <h3>${h.name}</h3>
      <div class="animals">${list.length ? list.map((a) => animalHTML(a)).join('') : '<p class="empty">Noch leer. Im Tierladen gibt es Bewohner!</p>'}</div>
    </section>`;
  }).join('');
  const masters = state.masters.map((id) => ({ uid: `m-${id}`, ...MASTER_ANIMALS[id], name: state.masterNames?.[id] || MASTER_ANIMALS[id].name }));
  const nMastered = state.masters.length;
  app.innerHTML = `
    <header class="top">
      <h1>🦁 ${state.name ? `${esc(state.name)}s Zoo` : 'Mein Zoo'}</h1>
      <div class="coins" title="Futter-Münzen">🪙 <b>${state.coins}</b></div>
      <button class="icon-btn" id="parents" aria-label="Elternbereich">⚙️</button>
    </header>
    <div class="actions">
      ${state.placementDone
        ? `<button class="big-btn primary" id="practice">🎯 Üben<small>${state.settings.sessionLength} Aufgaben · ca. 10 Minuten</small></button>
           <button class="big-btn" id="tempo">⚡ Tempo-Runde<small>1 Minute · schlag deinen Rekord</small></button>
           <button class="big-btn" id="shop">🛒 Tierladen<small>Tiere kaufen</small></button>`
        : `<button class="big-btn primary" id="placement">🚀 Los geht's!<small>Zuerst schauen wir, was du schon kannst.</small></button>`}
    </div>
    <section class="habitat master" style="--bg:#fff4d6;--bd:#e0a800">
      <h3>👑 Meister-Gehege <small>${nMastered} von ${SKILLS.length} Themen gemeistert</small></h3>
      <div class="animals">${masters.length ? masters.map((a) => animalHTML(a, 'gold')).join('') : '<p class="empty">Wenn du ein Thema richtig gut kannst, zieht hier ein besonderes Tier ein.</p>'}</div>
    </section>
    <div class="zoo">${habitats}</div>
    <p class="foot">Tippe auf ein Tier zum Füttern. Lange drücken, um ihm einen Namen zu geben.</p>`;
  $('#parents').onclick = renderParentGate;
  $('#placement')?.addEventListener('click', startPlacement);
  $('#practice')?.addEventListener('click', startPractice);
  $('#tempo')?.addEventListener('click', renderTempoMenu);
  $('#shop')?.addEventListener('click', renderShop);
  app.querySelectorAll('.animal').forEach(bindAnimal);
}

function bindAnimal(el) {
  let timer = null, long = false;
  const start = () => { long = false; timer = setTimeout(() => { long = true; renameAnimal(el.dataset.uid); }, 650); };
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
    const heart = document.createElement('span');
    heart.className = 'heart';
    heart.textContent = pick(Math.random, ['❤️', '💛', '😋', '🍎', '🥕', '🐟']);
    el.appendChild(heart);
    setTimeout(() => heart.remove(), 900);
    tone('coin');
  });
}

function renameAnimal(uid) {
  const name = prompt('Wie soll das Tier heißen?');
  if (!name || !name.trim()) return;
  const clean = name.trim().slice(0, 20);
  if (uid.startsWith('m-')) {
    state.masterNames ||= {};
    state.masterNames[uid.slice(2)] = clean;
  } else {
    const a = state.animals.find((x) => x.uid === uid);
    if (a) a.name = clean;
  }
  persist();
  renderHome();
}

// ---------- Tierladen ----------
function renderShop() {
  setKeys(null);
  const rows = HABITATS.map((h) => {
    const items = ANIMALS.filter((a) => a.h === h.id).map((a) => {
      const have = state.animals.filter((x) => x.id === a.id).length;
      const can = state.coins >= a.price;
      return `<button class="shop-item${can ? '' : ' locked'}" data-id="${a.id}" ${can ? '' : 'disabled'}>
        <span class="ae">${a.e}</span><span>${a.name}</span><span class="price">🪙 ${a.price}</span>${have ? `<span class="have">×${have}</span>` : ''}
      </button>`;
    }).join('');
    return `<section class="habitat" style="--bg:${h.bg};--bd:${h.border}"><h3>${h.name}</h3><div class="shop-grid">${items}</div></section>`;
  }).join('');
  app.innerHTML = `
    <header class="top"><button class="icon-btn" id="back" aria-label="Zurück">←</button><h1>🛒 Tierladen</h1><div class="coins">🪙 <b>${state.coins}</b></div></header>
    <p class="note">Münzen verdienst du beim Üben. Je schwerer die Aufgabe, desto mehr gibt es.</p>
    ${rows}`;
  $('#back').onclick = renderHome;
  app.querySelectorAll('.shop-item').forEach((b) => (b.onclick = () => buy(b.dataset.id)));
}

function buy(id) {
  const a = animalById(id);
  if (!a || state.coins < a.price) return;
  state.coins -= a.price;
  const n = state.animals.filter((x) => x.id === id).length;
  state.animals.push({ uid: `${id}-${Date.now()}`, id, name: n ? `${a.name} ${n + 1}` : a.name });
  persist();
  tone('buy');
  toast(`${a.e} ${a.name} ist in deinen Zoo eingezogen!`);
  renderShop();
}

function toast(msg) {
  document.querySelectorAll('.toast').forEach((x) => x.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

// ---------- Übungsrunde ----------
function startPractice() {
  const now = Date.now();
  const plan = planSession(state, now, Math.random, state.settings.sessionLength);
  session = newSession('practice', plan.map((skill) => ({ skill })));
  nextTask();
}

function startPlacement() {
  session = newSession('placement', PLACEMENT_SKILLS.map((skill) => ({ skill, level: 2 })));
  session.placement = {};
  renderIntro();
}

function newSession(mode, queue) {
  return { mode, queue, idx: -1, startedAt: Date.now(), results: {}, coins: 0, correct: 0, events: [], dueAtStart: {}, done: 0 };
}

function renderIntro() {
  app.innerHTML = `<div class="card center">
    <div class="mascot">🐨</div>
    <h2>Hallo${state.name ? ` ${esc(state.name)}` : ''}!</h2>
    <p>Ich bin Kiki, die Zoo-Wärterin. Bevor wir deinen Zoo bauen, zeigst du mir, was du schon kannst.</p>
    ${state.name ? '' : '<p><label>Wie heißt du?<br><input id="kidname" class="gate-input" maxlength="20" autocomplete="off"></label></p>'}
    <p>Das ist kein Test mit Noten. Wenn du etwas nicht weißt, ist das völlig okay. Dann üben wir es zusammen.</p>
    <button class="big-btn primary" id="go">Los geht's!</button></div>`;
  $('#go').onclick = () => {
    const n = $('#kidname')?.value.trim();
    if (n) { state.name = n.slice(0, 20); persist(); }
    nextTask();
  };
}

function nextTask() {
  session.idx += 1;
  if (session.idx >= session.queue.length) return finishSession();
  const item = session.queue[session.idx];
  const s = state.skills[item.skill];
  const level = item.level ?? s.level;
  if (!(item.skill in session.dueAtStart)) session.dueAtStart[item.skill] = s.box > 0 && s.due <= session.startedAt;
  session.task = generate(item.skill, level);
  session.item = item;
  session.attempt = 1;
  session.mistakes = 0;
  session.entry = '';
  session.phase = session.task.sach ? (session.task.sach.distractor !== null ? 'numbers' : 'schema') : 'answer';
  session.picked = new Set();
  renderTask();
}

function progressHTML() {
  const total = session.queue.length;
  let dots = '';
  for (let i = 0; i < total; i++) dots += `<span class="pdot${i < session.idx ? ' done' : i === session.idx ? ' now' : ''}"></span>`;
  return `<div class="progress">${dots}</div>`;
}

function renderTask() {
  const t = session.task;
  const skill = skillById(t.skill);
  const stars = '★'.repeat(t.level) + '☆'.repeat(3 - t.level);
  let body = '';
  if (t.sach) body = sachBody(t);
  else {
    body = `${t.text ? `<p class="task-text">${esc(t.text)}</p>` : ''}
      ${t.visual ? renderVisual(t.visual) : ''}
      ${t.expr ? `<div class="expr">${exprWithLive(t)}</div>` : ''}`;
  }
  app.innerHTML = `
    <header class="top slim">
      <button class="icon-btn" id="quit" aria-label="Beenden">✕</button>
      ${progressHTML()}
      <div class="coins">🪙 <b>${state.coins}</b></div>
    </header>
    <main class="card task">
      <div class="task-head"><span class="skill-name">${skill.name} <span class="stars" title="Stufe ${t.level}">${stars}</span></span>
        <button class="icon-btn small" id="speak" aria-label="Vorlesen">🔊</button></div>
      <h2 class="prompt">${esc(t.prompt)}</h2>
      ${body}
      <div id="feedback" class="feedback" aria-live="polite"></div>
      <div id="input-area"></div>
    </main>`;
  $('#quit').onclick = () => { if (confirm('Runde beenden? Deine Münzen bleiben dir.')) finishSession(); };
  $('#speak').onclick = () => speak(speakText(t));
  renderInput();
}

function speakText(t) {
  if (t.sach) return t.sach.tokens.map((k) => k.text ?? k.num).join('');
  return [t.prompt, t.text, t.expr].filter(Boolean).join('. ');
}

function exprWithLive(t) {
  const hasLiveInVisual = t.visual && (t.visual.type === 'wall' || t.visual.type === 'sequence');
  if (hasLiveInVisual) return esc(t.expr);
  return esc(t.expr).replace('?', '<span class="live-answer">?</span>');
}

function sachBody(t) {
  const sel = session.phase === 'numbers';
  const toks = t.sach.tokens.map((k, i) => {
    if (k.text !== undefined) return esc(k.text);
    const picked = session.picked.has(i);
    return sel || session.phase !== 'numbers'
      ? `<button class="num-chip${picked ? ' picked' : ''}" data-i="${i}" ${sel ? '' : 'disabled'}>${k.num}</button>`
      : String(k.num);
  }).join('');
  const steps = t.sach.distractor !== null ? ['Zahlen finden', 'Was passiert?', 'Rechnen'] : ['Was passiert?', 'Rechnen'];
  const cur = { numbers: 'Zahlen finden', schema: 'Was passiert?', answer: 'Rechnen' }[session.phase];
  const stepper = `<ol class="stepper">${steps.map((s) => `<li class="${s === cur ? 'now' : steps.indexOf(s) < steps.indexOf(cur) ? 'done' : ''}">${s}</li>`).join('')}</ol>`;
  let ask = '';
  if (session.phase === 'numbers') ask = '<p class="sub">Tippe die Zahlen an, die du für die Frage brauchst.</p>';
  if (session.phase === 'schema') ask = '<p class="sub">Was passiert in der Geschichte?</p>';
  if (session.phase === 'answer') ask = `<p class="sub">Rechne jetzt: ${t.sach.needed[0]} ${SCHEMAS[t.sach.schema].op} ${t.sach.needed[1]} = <span class="live-answer">?</span> ${esc(t.unit)}</p>`;
  return `${stepper}<p class="story">${toks}</p>${ask}`;
}

function renderInput() {
  const t = session.task;
  const area = $('#input-area');
  area.innerHTML = '';
  if (t.sach && session.phase === 'numbers') {
    app.querySelectorAll('.num-chip').forEach((b) => (b.onclick = () => {
      const i = Number(b.dataset.i);
      session.picked.has(i) ? session.picked.delete(i) : session.picked.add(i);
      b.classList.toggle('picked');
    }));
    area.innerHTML = '<button class="big-btn primary" id="ok">Fertig ✓</button>';
    $('#ok').onclick = submitNumbers;
    setKeys((e) => { if (e.key === 'Enter') submitNumbers(); });
    return;
  }
  if (t.sach && session.phase === 'schema') {
    area.innerHTML = `<div class="choices col">${t.sach.schemaChoices.map((c) => `<button class="choice" data-v="${c.value}">${esc(c.label)}</button>`).join('')}</div>`;
    area.querySelectorAll('.choice').forEach((b) => (b.onclick = () => submitSchema(b)));
    setKeys(null);
    return;
  }
  if (t.input === 'choice') {
    area.innerHTML = `<div class="choices">${t.choices.map((c) => `<button class="choice big" data-v="${esc(c.value)}">${esc(c.label)}</button>`).join('')}</div>`;
    area.querySelectorAll('.choice').forEach((b) => (b.onclick = () => submitAnswer(b.dataset.v, b)));
    setKeys((e) => { const c = t.choices.find((x) => x.value === e.key); if (c) submitAnswer(c.value, area.querySelector(`[data-v="${CSS.escape(c.value)}"]`)); });
    return;
  }
  const money = t.input === 'money';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', money ? ',' : '', '0', '⌫'];
  area.innerHTML = `<div class="answer-row"><div class="display" id="display">${session.entry || '&nbsp;'}</div>${money ? '<span class="unit">€</span>' : t.unit ? `<span class="unit">${esc(t.unit)}</span>` : ''}</div>
    <div class="keypad">${keys.map((k) => (k ? `<button class="key" data-k="${k}">${k}</button>` : '<span></span>')).join('')}</div>
    <button class="big-btn primary" id="ok">Prüfen ✓</button>`;
  area.querySelectorAll('.key').forEach((b) => (b.onclick = () => press(b.dataset.k)));
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
  updateLive();
}

function updateLive() {
  const d = $('#display');
  if (d) d.innerHTML = session.entry || '&nbsp;';
  app.querySelectorAll('.live-answer').forEach((el) => (el.textContent = session.entry || '?'));
}

function feedback(html, cls) {
  const f = $('#feedback');
  f.className = `feedback ${cls}`;
  f.innerHTML = html;
}

function submitNumbers() {
  const t = session.task;
  const pickedNums = [...session.picked].map((i) => t.sach.tokens[i].num);
  const ok = pickedNums.length === 2 && t.sach.needed.every((n) => pickedNums.includes(n));
  if (ok) {
    tone('ok');
    session.phase = 'schema';
    renderTask();
    feedback('Richtig! Die Zahl ' + t.sach.distractor + ' braucht man für die Frage nicht.', 'good');
    return;
  }
  session.mistakes += 1;
  tone('bad');
  if (session.mistakes >= 2) {
    session.picked = new Set(t.sach.tokens.map((k, i) => (t.sach.needed.includes(k.num) && k.role !== 'd' ? i : -1)).filter((i) => i >= 0));
    session.phase = 'schema';
    renderTask();
    feedback(`Man braucht ${t.sach.needed.join(' und ')}. Die Zahl ${t.sach.distractor} hat mit der Frage nichts zu tun.`, 'hint');
    return;
  }
  feedback('Nicht ganz. Lies die Frage am Ende nochmal: Welche Zahlen braucht man wirklich? Eine Zahl ist eine Falle!', 'hint');
}

function submitSchema(btn) {
  const t = session.task;
  if (btn.dataset.v === t.sach.schema) {
    tone('ok');
    session.phase = 'answer';
    renderTask();
    feedback(`Genau: ${SCHEMAS[t.sach.schema].label}.`, 'good');
    return;
  }
  session.mistakes += 1;
  tone('bad');
  btn.classList.add('wrong');
  btn.disabled = true;
  const tips = {
    dazu: 'Achte auf Wörter wie „dazu“, „zusammen“, „insgesamt“.',
    weg: 'Achte auf Wörter wie „übrig“, „bleiben“, „noch“, „fressen“.',
    vergleich: 'Achte auf Wörter wie „mehr“, „größer“, „weniger“, „Unterschied“.',
    mal: 'Achte auf „in jedem“, „je“: gleich viele in jeder Gruppe.',
    teilen: 'Achte auf „gerecht verteilt“, „Gruppen mit je“.',
  };
  feedback(`Nicht ganz. ${tips[t.sach.schema]}`, 'hint');
}

function submitAnswer(given, btn) {
  if (session.locked) return;
  const t = session.task;
  if (t.input !== 'choice' && String(given).trim() === '') return;
  const ok = check(t, given);
  const placement = session.mode === 'placement';
  if (ok) {
    const firstTry = session.attempt === 1 && session.mistakes === 0;
    tone('ok');
    btn?.classList.add('right');
    finishTask(firstTry, true);
    const msg = firstTry ? pick(Math.random, PRAISE) : pick(Math.random, PRAISE_RETRY);
    feedback(`<b>${msg}</b>${t.sach ? `<br>${esc(t.sach.answerSentence)}` : ''} <span class="plus">+${session.lastCoins} 🪙</span>`, 'good');
    showNext();
    return;
  }
  tone('bad');
  btn?.classList.add('wrong');
  if (session.attempt === 1 && !placement) {
    session.attempt = 2;
    session.entry = '';
    updateLive();
    feedback(`<b>Fast!</b> ${esc(t.hint.text)}${t.hint.visual ? renderVisual(t.hint.visual) : ''}<br>Versuch es nochmal.`, 'hint');
    return;
  }
  finishTask(false, false);
  const correct = t.input === 'money' ? euro(t.answer) : t.answer;
  feedback(placement
    ? `Das ist noch neu für dich. Kein Problem, das üben wir!<br><small>Richtig wäre: ${esc(correct)}</small>`
    : `Richtig ist: <b>${esc(correct)}</b><br>So geht's: ${esc(t.solution)}<br><small>${pick(Math.random, ENCOURAGE)}</small>`, 'show');
  showNext();
}

function finishTask(firstTry, solved) {
  const t = session.task;
  const now = Date.now();
  session.locked = true;
  session.done += 1;
  if (firstTry) session.correct += 1;
  session.results[t.skill] ||= [];
  session.results[t.skill].push(firstTry);
  const coins = coinsFor({ firstTry, solved, level: t.level, wasDue: session.dueAtStart[t.skill] });
  session.lastCoins = coins;
  session.coins += coins;
  state.coins += coins;
  state.coinsTotal += coins;
  const coinEl = $('.top .coins b');
  if (coinEl) coinEl.textContent = state.coins;
  if (session.mode === 'placement') {
    session.placement[t.skill] ||= {};
    session.placement[t.skill][`r${t.level}`] = firstTry;
    if (t.level === 2 && firstTry) session.queue.splice(session.idx + 1, 0, { skill: t.skill, level: 3 });
  } else {
    const ev = recordAnswer(state.skills[t.skill], firstTry, now);
    if (ev === 'levelUp') session.events.push({ type: 'levelUp', skill: t.skill, level: state.skills[t.skill].level });
    if (ev === 'mastered' && !state.masters.includes(t.skill)) {
      state.masters.push(t.skill);
      session.events.push({ type: 'mastered', skill: t.skill });
    }
    // Falsch gelöste Aufgabe: ähnliche Aufgabe kommt 3 Aufgaben später nochmal
    if (!firstTry && !session.item.retry) {
      session.queue.splice(Math.min(session.idx + 4, session.queue.length), 0, { skill: t.skill, retry: true });
    }
  }
  persist();
}

function showNext() {
  const area = $('#input-area');
  const go = () => { session.locked = false; nextTask(); };
  area.innerHTML = '<button class="big-btn primary" id="next">Weiter →</button>';
  $('#next').onclick = go;
  setKeys((e) => { if (e.key === 'Enter') go(); });
}

function finishSession() {
  const now = Date.now();
  const s = session;
  session = null;
  setKeys(null);
  if (s.mode === 'placement') {
    for (const id of PLACEMENT_SKILLS) {
      const p = s.placement?.[id];
      if (!p) continue;
      state.skills[id].level = placementLevel(p.r2, p.r3);
      state.skills[id].box = Math.max(state.skills[id].box, 1);
      state.skills[id].due = now;
    }
    state.placementDone = s.idx >= s.queue.length;
  } else {
    for (const [id, res] of Object.entries(s.results)) scheduleAfterSession(state.skills[id], res, now, s.dueAtStart[id]);
  }
  const k = dayKey(now);
  state.log[k] ||= { secs: 0, tasks: 0, correct: 0 };
  state.log[k].secs += Math.round((now - s.startedAt) / 1000);
  state.log[k].tasks += s.done;
  state.log[k].correct += s.correct;
  persist();

  const evs = s.events.map((e) => (e.type === 'mastered'
    ? `<li class="ev gold">👑 Du hast <b>${skillById(e.skill).name}</b> gemeistert! ${MASTER_ANIMALS[e.skill].e} ${MASTER_ANIMALS[e.skill].name} zieht ins Meister-Gehege ein.</li>`
    : `<li class="ev">⬆️ ${skillById(e.skill).name}: jetzt Stufe ${'★'.repeat(e.level)}</li>`)).join('');
  const intro = s.mode === 'placement'
    ? (state.placementDone ? '<p>Danke! Jetzt weiß ich, wo wir anfangen. Kauf dir im Tierladen dein erstes Tier!</p>' : '<p>Wir machen später weiter.</p>')
    : '';
  app.innerHTML = `<div class="card center">
    <div class="mascot">${s.correct >= s.done * 0.8 ? '🎉' : '🐨'}</div>
    <h2>Runde geschafft!</h2>
    ${intro}
    <div class="stats"><div><b>${s.correct}</b> von ${s.done}<br><small>gleich richtig</small></div><div><b>+${s.coins}</b> 🪙<br><small>Münzen verdient</small></div></div>
    ${evs ? `<ul class="events">${evs}</ul>` : ''}
    <div class="row-btns"><button class="big-btn primary" id="shop">🛒 Tierladen</button><button class="big-btn" id="home">🏠 Zum Zoo</button></div>
  </div>`;
  if (s.events.some((e) => e.type === 'mastered')) tone('buy');
  $('#shop').onclick = renderShop;
  $('#home').onclick = renderHome;
}

// ---------- Tempo-Runde ----------
function renderTempoMenu() {
  setKeys(null);
  app.innerHTML = `
    <header class="top"><button class="icon-btn" id="back" aria-label="Zurück">←</button><h1>⚡ Tempo-Runde</h1><div class="coins">🪙 <b>${state.coins}</b></div></header>
    <div class="card center">
      <p>Eine Minute. Wie viele schaffst du? Du trittst nur gegen <b>deinen eigenen Rekord</b> an.</p>
      <div class="row-btns">
        <button class="big-btn primary" data-m="einmaleins">✖️ Einmaleins<small>Rekord: ${state.tempoBest.einmaleins}</small></button>
        <button class="big-btn primary" data-m="plusminus">➕➖ Plus & Minus<small>Rekord: ${state.tempoBest.plusminus}</small></button>
      </div>
      <p class="note">Tipp: Lieber richtig als schnell. Falsche Antworten kosten nichts, zählen aber nicht.</p>
    </div>`;
  $('#back').onclick = renderHome;
  app.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => startTempo(b.dataset.m)));
}

function tempoTask(mode) {
  if (mode === 'einmaleins') return generate('einmaleins', int(Math.random, 1, state.skills.einmaleins.level));
  return generate(pick(Math.random, ['plus_ohne', 'minus_ohne']), int(Math.random, 1, 2));
}

function startTempo(mode) {
  tempo = { mode, correct: 0, wrong: 0, end: Date.now() + 60000, entry: '', task: tempoTask(mode) };
  app.innerHTML = `
    <header class="top slim"><button class="icon-btn" id="quit" aria-label="Beenden">✕</button><div class="timer"><div id="bar"></div></div><div class="coins">✅ <b id="cnt">0</b></div></header>
    <main class="card task">
      <div class="expr big" id="texpr"></div>
      <div class="answer-row"><div class="display" id="display">&nbsp;</div></div>
      <div class="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k) => (k ? `<button class="key" data-k="${k}">${k}</button>` : '<span></span>')).join('')}</div>
      <button class="big-btn primary" id="ok">OK ✓</button>
    </main>`;
  const show = () => { $('#texpr').innerHTML = esc(tempo.task.expr).replace('?', '<span class="live-answer">?</span>'); $('#display').innerHTML = tempo.entry || '&nbsp;'; };
  const upd = () => { $('#display').innerHTML = tempo.entry || '&nbsp;'; $('.live-answer').textContent = tempo.entry || '?'; };
  const tpress = (k) => { if (k === '⌫') tempo.entry = tempo.entry.slice(0, -1); else if (tempo.entry.length < 4) tempo.entry += k; upd(); };
  const submit = () => {
    if (!tempo.entry) return;
    if (check(tempo.task, tempo.entry)) { tempo.correct += 1; tone('coin'); $('#cnt').textContent = tempo.correct; }
    else { tempo.wrong += 1; tone('bad'); $('.expr').classList.add('shake'); setTimeout(() => $('.expr')?.classList.remove('shake'), 400); }
    tempo.entry = '';
    tempo.task = tempoTask(mode);
    show();
  };
  app.querySelectorAll('.key').forEach((b) => (b.onclick = () => tpress(b.dataset.k)));
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
  const old = state.tempoBest[t.mode];
  const record = t.correct > old;
  if (record) state.tempoBest[t.mode] = t.correct;
  const coins = Math.floor(t.correct / 3) + (record ? 3 : 0);
  state.coins += coins;
  state.coinsTotal += coins;
  persist();
  if (record) tone('buy');
  app.innerHTML = `<div class="card center">
    <div class="mascot">${record ? '🏆' : '⚡'}</div>
    <h2>${record ? 'Neuer Rekord!' : 'Zeit ist um!'}</h2>
    <div class="stats"><div><b>${t.correct}</b><br><small>richtig</small></div><div><b>${old}</b><br><small>alter Rekord</small></div><div><b>+${coins}</b> 🪙</div></div>
    ${!record && t.correct > 0 ? `<p>${t.correct >= old - 2 ? 'Ganz knapp dran!' : 'Mit jedem Üben wirst du schneller.'}</p>` : ''}
    <div class="row-btns"><button class="big-btn primary" id="again">Nochmal</button><button class="big-btn" id="home">🏠 Zum Zoo</button></div>
  </div>`;
  $('#again').onclick = () => startTempo(t.mode);
  $('#home').onclick = renderHome;
}

// ---------- Elternbereich ----------
function renderParentGate() {
  const a = int(Math.random, 13, 19), b = int(Math.random, 4, 9);
  app.innerHTML = `
    <header class="top"><button class="icon-btn" id="back" aria-label="Zurück">←</button><h1>Elternbereich</h1></header>
    <div class="card center"><p>Nur für Erwachsene. Wie viel ist</p><div class="expr">${a} · ${b} = ?</div>
      <input id="gate" inputmode="numeric" autocomplete="off" class="gate-input"><br><button class="big-btn primary" id="ok">Öffnen</button></div>`;
  $('#back').onclick = renderHome;
  const go = () => (Number($('#gate').value) === a * b ? renderParents() : ($('#gate').value = ''));
  $('#ok').onclick = go;
  $('#gate').addEventListener('keydown', (e) => e.key === 'Enter' && go());
  $('#gate').focus();
}

const fmtDate = (ts) => (ts ? new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '–');

function renderParents() {
  setKeys(null);
  const now = Date.now();
  const rows = Object.entries(GROUPS).map(([g, gname]) => {
    const skills = SKILLS.filter((s) => s.group === g).map((sk) => {
      const s = state.skills[sk.id];
      const acc = accuracy(s);
      const accCls = acc === null ? '' : acc >= 0.8 ? 'good' : acc >= 0.6 ? 'mid' : 'bad';
      const due = s.attempts === 0 ? 'neu' : s.due <= now ? 'jetzt' : fmtDate(s.due);
      return `<tr>
        <td><label><input type="checkbox" data-focus="${sk.id}" ${state.focus.includes(sk.id) ? 'checked' : ''}> ${sk.name}</label></td>
        <td class="stars">${'★'.repeat(s.level)}${'☆'.repeat(3 - s.level)}${s.mastered ? ' 👑' : ''}</td>
        <td class="${accCls}">${acc === null ? '–' : Math.round(acc * 100) + ' %'}</td>
        <td>${s.attempts}</td><td>${fmtDate(s.lastSeen)}</td><td>${due}</td></tr>`;
    }).join('');
    return `<tr class="grp-row"><th colspan="6">${gname}</th></tr>${skills}`;
  }).join('');
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const k = dayKey(now - i * DAY);
    const l = state.log[k] || { secs: 0, tasks: 0, correct: 0 };
    days.push({ k, label: new Date(now - i * DAY).toLocaleDateString('de-DE', { weekday: 'short' }), ...l });
  }
  const maxMin = Math.max(10, ...days.map((d) => d.secs / 60));
  const chart = days.map((d) => `<div class="bar-col"><div class="bar" style="height:${(d.secs / 60 / maxMin) * 100}%"></div><small>${Math.round(d.secs / 60)}′</small><span>${d.label}</span></div>`).join('');
  const weak = SKILLS.filter((sk) => { const a = accuracy(state.skills[sk.id]); return a !== null && state.skills[sk.id].recent.length >= 5 && a < 0.7; }).map((s) => s.name);
  app.innerHTML = `
    <header class="top"><button class="icon-btn" id="back" aria-label="Zurück">←</button><h1>Elternbereich</h1></header>
    <div class="card parents">
      <h2>Überblick</h2>
      <p>${state.coinsTotal} Münzen insgesamt verdient · ${state.animals.length} Tiere · ${state.masters.length} von ${SKILLS.length} Themen gemeistert</p>
      ${weak.length ? `<p class="warn">Hier hakt es gerade (unter 70 % richtig): <b>${weak.join(', ')}</b></p>` : ''}
      <h3>Übungszeit letzte 7 Tage</h3>
      <div class="chart">${chart}</div>
      <h3>Themen</h3>
      <p class="note">Häkchen = aktuelles Schulthema. Diese Themen kommen in den Runden öfter dran. Voreingestellt ist der MiniMax-Arbeitsplan Nr. 2.</p>
      <div class="table-wrap"><table class="skills">
        <tr><th>Thema</th><th>Stufe</th><th>Treffer*</th><th>Aufgaben</th><th>Zuletzt</th><th>Wiederholen</th></tr>
        ${rows}
      </table></div>
      <p class="note">* Anteil „beim ersten Versuch richtig“ bei den letzten 20 Aufgaben. Ziel ist etwa 80 %. Die Stufe passt sich automatisch an.</p>
      <h3>Einstellungen</h3>
      <label class="set">Name <input id="name" value="${esc(state.name)}" maxlength="20"></label>
      <label class="set">Aufgaben pro Runde
        <select id="len">${[8, 12, 16].map((n) => `<option ${state.settings.sessionLength === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="set"><input type="checkbox" id="sound" ${state.settings.sound ? 'checked' : ''}> Töne an</label>
      <h3>Spielstand sichern</h3>
      <p class="note">Der Spielstand liegt nur auf diesem iPad. Wenn in Safari die Website-Daten gelöscht werden, ist er weg. Sichere ihn ab und zu als Datei (z. B. in iCloud Drive).</p>
      <div class="row-btns">
        <button class="big-btn" id="export">💾 Sichern</button>
        <label class="big-btn file">📂 Wiederherstellen<input type="file" id="import" accept="application/json,.json" hidden></label>
        <button class="big-btn danger" id="reset">🗑 Alles zurücksetzen</button>
        ${state.placementDone ? '<button class="big-btn" id="replace">Einstufung wiederholen</button>' : ''}
      </div>
    </div>`;
  $('#back').onclick = renderHome;
  app.querySelectorAll('[data-focus]').forEach((cb) => (cb.onchange = () => {
    const id = cb.dataset.focus;
    state.focus = cb.checked ? [...new Set([...state.focus, id])] : state.focus.filter((x) => x !== id);
    persist();
  }));
  $('#name').onchange = (e) => { state.name = e.target.value.trim(); persist(); };
  $('#len').onchange = (e) => { state.settings.sessionLength = Number(e.target.value); persist(); };
  $('#sound').onchange = (e) => { state.settings.sound = e.target.checked; persist(); };
  $('#export').onclick = () => exportFile(state);
  $('#import').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const s = await importFile(f);
      if (!confirm('Den aktuellen Spielstand durch die Datei ersetzen?')) return;
      state = s;
      persist();
      toast('Spielstand wiederhergestellt.');
      renderParents();
    } catch (err) { alert(err.message); }
  };
  $('#reset').onclick = () => {
    if (!confirm('Wirklich ALLES löschen? Tiere, Münzen und Lernstand sind dann weg.')) return;
    if (!confirm('Ganz sicher? Das kann man nicht rückgängig machen (außer mit einer gesicherten Datei).')) return;
    state = freshState();
    persist();
    renderHome();
  };
  $('#replace')?.addEventListener('click', () => { startPlacement(); });
}

// ---------- Start ----------
renderHome();

// Nur für automatische Tests (Adresse mit #test): Zugriff auf die laufende Runde
if (location.hash === '#test') window.__zoo = { get session() { return session; }, get state() { return state; } };

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
// Spracheausgabe: Stimmen werden auf iOS verzögert geladen
if ('speechSynthesis' in window) speechSynthesis.getVoices();
