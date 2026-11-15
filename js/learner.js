// Lernmodell: Niveau-Anpassung pro Fähigkeit, Wiedervorlage (Leitner-Kästen),
// Zusammenstellung einer Übungsrunde. Reine Funktionen, `now` wird übergeben.

import { SKILLS } from './tasks.js';

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

export function skillWeight(id, s, focus, now) {
  let w = 1;
  const isFocus = focus.includes(id);
  if (isFocus) w += 6;
  if (s.box > 0 && s.due <= now) w += 3;
  const acc = accuracy(s);
  if (acc !== null && s.recent.length >= 3 && acc < 0.7) w += 2;
  if (s.mastered && s.due > now) w = 0.2;
  return w;
}

// Stellt eine gemischte Runde zusammen: höchstens `maxPer` Aufgaben pro Fähigkeit,
// nie zweimal dieselbe Fähigkeit direkt hintereinander (Interleaving).
export function planSession(state, now, r = Math.random, n = 12, maxPer = 4) {
  const focus = state.focus || [];
  const ids = SKILLS.map((s) => s.id);
  const used = Object.fromEntries(ids.map((id) => [id, 0]));
  const plan = [];
  for (let i = 0; i < n; i++) {
    const prev = plan[plan.length - 1];
    const cands = ids.filter((id) => used[id] < maxPer && id !== prev);
    if (!cands.length) break;
    const weights = cands.map((id) => skillWeight(id, state.skills[id], focus, now));
    const total = weights.reduce((a, b) => a + b, 0);
    let x = r() * total;
    let chosen = cands[cands.length - 1];
    for (let k = 0; k < cands.length; k++) {
      x -= weights[k];
      if (x <= 0) { chosen = cands[k]; break; }
    }
    used[chosen] += 1;
    plan.push(chosen);
  }
  return plan;
}

// Einstufungstest: pro Fähigkeit erst eine Aufgabe auf Stufe 2, bei Erfolg Stufe 3.
export const PLACEMENT_SKILLS = ['stellenwert', 'nachbarzahlen', 'ordnen', 'zahlenstrahl', 'plus_ohne', 'minus_ohne', 'plus_mit', 'minus_mit', 'einmaleins', 'teilen', 'geld_umrechnen', 'sachaufgaben'];

export function placementLevel(res2, res3) {
  if (!res2) return 1;
  if (res3) return 3;
  return 2;
}

// Münzen: Erfolg beim ersten Versuch zählt am meisten, schwerere und fällige Aufgaben bringen mehr.
export function coinsFor({ firstTry, solved, level, wasDue }) {
  if (!solved) return 0;
  if (!firstTry) return 1;
  return 2 + (level === 3 ? 1 : 0) + (wasDue ? 1 : 0);
}

export const dayKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
