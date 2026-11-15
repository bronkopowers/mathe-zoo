// Spielstand im Browser-Speicher des iPads (localStorage). Nichts verlässt das Gerät.
import { ensureSkills } from './learner.js';

const KEY = 'mathe-zoo-v1';

// Voreingestellte Schulthemen (MiniMax 3, Arbeitsplan Nr. 2)
export const DEFAULT_FOCUS = ['plus_ohne', 'minus_ohne', 'zahlenmauer', 'zahlenfolgen', 'fachbegriffe', 'sachaufgaben', 'geld_umrechnen', 'geld_rechnen'];

export function freshState() {
  return ensureSkills({
    version: 1,
    name: '',
    createdAt: Date.now(),
    placementDone: false,
    coins: 0,
    coinsTotal: 0,
    animals: [], // {uid, id, name}
    masters: [], // skill ids
    focus: [...DEFAULT_FOCUS],
    log: {}, // dayKey -> {secs, tasks, correct}
    tempoBest: { einmaleins: 0, plusminus: 0 },
    settings: { sound: true, sessionLength: 12 },
  });
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const s = JSON.parse(raw);
    return ensureSkills({ ...freshState(), ...s, settings: { ...freshState().settings, ...(s.settings || {}) } });
  } catch {
    return freshState();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportFile(state) {
  const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `mathe-zoo-spielstand-${d}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function importFile(file) {
  const text = await file.text();
  const s = JSON.parse(text);
  if (!s || s.version !== 1 || !s.skills) throw new Error('Das ist keine Spielstand-Datei vom Mathe-Zoo.');
  return ensureSkills({ ...freshState(), ...s });
}
