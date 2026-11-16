// Lernmodell: Niveau-Anpassung pro Fähigkeit, Wiedervorlage (Leitner-Kästen),
// Zusammenstellung einer Runde an einem Ort. Reine Funktionen, `now` wird übergeben.

import { SKILLS } from './catalog.js';

export const DAY = 24 * 60 * 60 * 1000;
// Abstände in Tagen pro Kasten. Kasten 0 = noch nie geübt.
export const INTERVALS = [0, 1, 2, 4, 7, 14, 30];

export function newSkillState() {
  return { level: 1, attempts: 0, correct: 0, recent: [], levelRecent: [], box: 0, due: 0, mastered: false, lastSeen: 0 };
}

export function ensureSkills(state) {
  state.skills ||= {};
  for (const s of SKILLS) state.skills[s.id] ||= newSkillState();
  return state;
}

const count = (arr) => arr.filter(Boolean).length;

// Eine Antwort verbuchen. Gibt ein Ereignis zurück: 'levelUp' | 'levelDown' | 'mastered' | null
export function recordAnswer(s, correct, now) {
  s.attempts += 1;
  if (correct) s.correct += 1;
  s.recent = [...s.recent, correct].slice(-20);
  s.levelRecent = [...s.levelRecent, correct].slice(-8);
  s.lastSeen = now;
  const lr = s.levelRecent;
  const last5 = lr.slice(-5);
  const last4 = lr.slice(-4);
  // Ziel: ca. 80–85 % Erfolg. 4 von 5 richtig -> schwerer, höchstens 1 von 4 -> leichter.
  if (s.level < 3 && last5.length >= 5 && count(last5) >= 4) {
    s.level += 1;
    s.levelRecent = [];
    return 'levelUp';
  }
  if (s.level > 1 && last4.length >= 4 && count(last4) <= 1) {
    s.level -= 1;
    s.levelRecent = [];
    return 'levelDown';
  }
  // Gemeistert erst, wenn es auch nach Pausen schon geklappt hat (Kasten >= 2)
  if (s.level === 3 && !s.mastered && s.box >= 2 && lr.length >= 8 && count(lr) >= 7) {
    s.mastered = true;
    return 'mastered';
  }
  return null;
}

// Nach einer Runde: Wiedervorlage-Termin pro geübter Fähigkeit setzen.
// Aufsteigen in den nächsten Kasten nur, wenn die Fähigkeit fällig war –
// mehrere Runden am selben Tag zählen nicht als "nach einer Pause behalten".
export function scheduleAfterSession(s, results, now, wasDue = true) {
  if (!results.length) return;
  const acc = count(results) / results.length;
  if (acc >= 0.8) s.box = wasDue || s.box === 0 ? Math.min(s.box + 1, INTERVALS.length - 1) : s.box;
  else if (acc < 0.6) s.box = 1;
  else s.box = Math.max(s.box, 1);
  // Was noch nicht gemeistert ist, kommt spätestens nach 2 Tagen wieder.
  const box = s.mastered ? s.box : Math.min(s.box, 2);
  s.due = now + INTERVALS[box] * DAY;
}

export function accuracy(s) {
  return s.recent.length ? count(s.recent) / s.recent.length : null;
}

export const isDue = (s, now) => s.box > 0 && s.due <= now;

export function skillWeight(s, now) {
  let w = 1;
  if (isDue(s, now)) w += 3;
  const acc = accuracy(s);
  if (acc !== null && s.recent.length >= 3 && acc < 0.7) w += 2;
  if (s.attempts === 0) w += 1;
  if (s.mastered && s.due > now) w = 0.3;
  return w;
}

function drawWeighted(ids, k, skills, now, r, maxPer) {
  const used = {};
  const out = [];
  for (let i = 0; i < k; i++) {
    const prev = out[out.length - 1];
    const free = ids.filter((id) => (used[id] || 0) < maxPer);
    const cands = free.filter((id) => id !== prev).length ? free.filter((id) => id !== prev) : free;
    if (!cands.length) break;
    const weights = cands.map((id) => skillWeight(skills[id], now));
    let x = r() * weights.reduce((a, b) => a + b, 0);
    let chosen = cands[cands.length - 1];
    for (let j = 0; j < cands.length; j++) {
      x -= weights[j];
      if (x <= 0) { chosen = cands[j]; break; }
    }
    used[chosen] = (used[chosen] || 0) + 1;
    out.push(chosen);
  }
  return out;
}

// Eine Runde an einem Ort: Aufgaben aus den Themen des Ortes, gemischt (Interleaving),
// dazu bis zu `nReview` fällige Wiederholungen aus anderen, schon geübten Themen.
export function planRound(skills, placeIds, otherIds, now, r = Math.random, n = 10, nReview = 2) {
  const dueOthers = otherIds.filter((id) => !placeIds.includes(id) && skills[id].attempts > 0 && isDue(skills[id], now));
  const review = drawWeighted(dueOthers, Math.min(nReview, dueOthers.length), skills, now, r, 1);
  const maxPer = Math.max(2, Math.ceil(n / Math.min(placeIds.length, 4)));
  const plan = drawWeighted(placeIds, n - review.length, skills, now, r, maxPer);
  review.forEach((id, i) => plan.splice(Math.min(plan.length, 3 + i * 4), 0, id));
  return plan;
}

// Sterne eines Ortes: 1 = eine Runde geschafft, 2 = alle Themen mindestens Stufe 2, 3 = alle gemeistert
export function placeStars(skills, placeIds, rounds) {
  if (!rounds) return 0;
  if (placeIds.every((id) => skills[id].mastered)) return 3;
  if (placeIds.every((id) => skills[id].attempts > 0 && skills[id].level >= 2)) return 2;
  return 1;
}

export const dayKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Münzen: Erfolg beim ersten Versuch zählt am meisten, schwerere und fällige Aufgaben bringen mehr.
export function coinsFor({ firstTry, solved, level, wasDue }) {
  if (!solved) return 0;
  if (!firstTry) return 1;
  return 2 + (level === 3 ? 1 : 0) + (wasDue ? 1 : 0);
}

// Einstufung auswerten. results: { skillId: { r2: bool, r3: bool } } (Aufgabe auf Stufe 2, bei Erfolg auf Stufe 3).
// Geprüfte Themen bekommen ihre eigene Stufe. Die übrigen Themen eines Ortes starten
// auf dem Schnitt der beiden geprüften, aber höchstens auf Stufe 2.
export function placementLevels(results, reps, topics) {
  const out = {};
  reps.forEach((pair, i) => {
    const lv = pair.map((id) => { const r = results[id]; return !r || r.r2 === undefined ? null : !r.r2 ? 1 : r.r3 ? 3 : 2; });
    const known = lv.filter((x) => x !== null);
    if (!known.length) return;
    const placeLv = Math.min(2, Math.floor(known.reduce((a, b) => a + b, 0) / known.length));
    for (const id of topics[i]) out[id] = placeLv;
    pair.forEach((id, k) => { if (lv[k] !== null) out[id] = lv[k]; });
  });
  return out;
}
