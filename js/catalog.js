// Gesamtkatalog aller Fähigkeiten und die Zuordnung zu den drei Themen-Orten je Klasse.
import { SKILLS as SKILLS3 } from './tasks.js';
import { SKILLS4 } from './tasks4.js';

export const SKILLS = [...SKILLS3.map((s) => ({ ...s, grade: 3 })), ...SKILLS4];
export const skillById = (id) => SKILLS.find((s) => s.id === id);

export function generate(skillId, level, r = Math.random) {
  const s = skillById(skillId);
  if (!s) throw new Error(`Unbekannte Fähigkeit: ${skillId}`);
  return s.gen(Math.max(1, Math.min(3, level)), r);
}

export const GRADES = [3, 4];
export const TOPIC_NAMES = ['Zahlen', 'Plus & Minus', 'Mal, Geteilt & Sachaufgaben'];

// Ort 1: Zahlen · Ort 2: Plus & Minus · Ort 3: Mal, Geteilt, Größen, Sachaufgaben
export const TOPICS = {
  3: [
    ['stellenwert', 'nachbarzahlen', 'ordnen', 'zahlenstrahl', 'zahlenfolgen'],
    ['plus_ohne', 'minus_ohne', 'plus_mit', 'minus_mit', 'zahlenmauer', 'fachbegriffe'],
    ['einmaleins', 'teilen', 'geld_umrechnen', 'geld_rechnen', 'sachaufgaben'],
  ],
  4: [
    ['g4_stellenwert', 'g4_nachbar', 'g4_ordnen', 'g4_runden', 'g4_zahlenstrahl'],
    ['g4_plus', 'g4_minus', 'g4_ueberschlag', 'plus_mit', 'minus_mit'],
    ['einmaleins', 'g4_mal', 'g4_teilen', 'g4_rest', 'g4_groessen', 'g4_sach'],
  ],
};
