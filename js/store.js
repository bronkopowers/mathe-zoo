// Spielstände im Browser-Speicher des iPads (localStorage). Nichts verlässt das Gerät.
// Ein Datensatz enthält mehrere Profile (ein Profil pro Kind).
import { ensureSkills } from './learner.js';
import { skillById } from './catalog.js';

const KEY = 'zahlenwelten-v2';
const OLD_KEYS = ['mathe-zoo-v1'];

export function freshData() {
  return { version: 2, profiles: [], activeId: null, settings: { sound: true } };
}

export function newProfile(name, grade, world) {
  const p = ensureSkills({
    id: `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`,
    name, grade, world,
    createdAt: Date.now(),
    places: {}, // ortId -> { rounds }
    coins: 0, coinsTotal: 0,
    items: [], // Sammlung: { uid, id, name }
    log: {}, // Tag -> { secs, tasks, correct }
    tempoBest: { einmaleins: 0, plusminus: 0 },
  });
  // Stoff aus früheren Klassen startet eine Stufe höher
  for (const [id, s] of Object.entries(p.skills)) if ((skillById(id)?.grade ?? grade) < grade) s.level = 2;
  return p;
}

function normalize(d) {
  const data = { ...freshData(), ...d, settings: { ...freshData().settings, ...(d.settings || {}) } };
  data.profiles = (data.profiles || []).map((p) => ensureSkills({ places: {}, log: {}, tempoBest: { einmaleins: 0, plusminus: 0 }, coins: 0, coinsTotal: 0, items: [], ...p }));
  if (!data.profiles.some((p) => p.id === data.activeId)) data.activeId = null;
  return data;
}

// Spielstand aus Version 1 übernehmen (ein Kind, Klasse 3, Zoo)
function migrate() {
  for (const k of OLD_KEYS) {
    try {
      const old = JSON.parse(localStorage.getItem(k) || 'null');
      if (!old || !old.skills || !old.placementDone) continue;
      const p = newProfile(old.name || 'Kind', 3, 'zoo');
      for (const [id, s] of Object.entries(old.skills)) if (p.skills[id]) p.skills[id] = s;
      p.log = old.log || {};
      p.tempoBest = old.tempoBest || p.tempoBest;
      const data = freshData();
      data.profiles.push(p);
      return data;
    } catch { /* alter Stand unlesbar: ignorieren */ }
  }
  return null;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
    return migrate() || freshData();
  } catch {
    return freshData();
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function exportFile(data) {
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zahlenwelten-spielstand-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function importFile(file) {
  const d = JSON.parse(await file.text());
  if (!d || d.version !== 2 || !Array.isArray(d.profiles)) throw new Error('Das ist keine Spielstand-Datei der Zahlenwelten.');
  return normalize(d);
}
