// Gesamtkatalog aller Fähigkeiten und die Zuordnung zu den drei Themen-Orten je Klasse.
import { SKILLS as SKILLS3 } from './tasks.js';
import { SKILLS4 } from './tasks4.js';
import { SKILLS_EXTRA } from './tasks_extra.js';

export const SKILLS = [...SKILLS3.map((s) => ({ ...s, grade: 3 })), ...SKILLS4, ...SKILLS_EXTRA];
export const skillById = (id) => SKILLS.find((s) => s.id === id);

export function generate(skillId, level, r = Math.random) {
  const s = skillById(skillId);
  if (!s) throw new Error(`Unbekannte Fähigkeit: ${skillId}`);
  return s.gen(Math.max(1, Math.min(3, level)), r);
}

export const GRADES = [3, 4];
export const TOPIC_NAMES = ['Zahlen', 'Plus & Minus', 'Mal & Geteilt', 'Geld, Zeit & Größen', 'Sachaufgaben & Knobeln'];

// Fünf Themen-Orte je Klasse, in der Reihenfolge der Orte auf der Karte
export const TOPICS = {
  3: [
    ['stellenwert', 'nachbarzahlen', 'ordnen', 'reihe', 'zahlenstrahl', 'strahl_tippen', 'zahlenfolgen'],
    ['plus_ohne', 'minus_ohne', 'plus_mit', 'minus_mit', 'doppelt_halb'],
    ['einmaleins', 'teilen', 'zehner_mal'],
    ['geld_umrechnen', 'geld_rechnen', 'geld_legen', 'g3_groessen', 'zeit'],
    ['sachaufgaben', 'platzhalter', 'zahlenmauer', 'fachbegriffe', 'g4_sach'],
  ],
  4: [
    ['g4_stellenwert', 'g4_nachbar', 'g4_ordnen', 'g4_reihe', 'g4_runden', 'g4_zahlenstrahl', 'g4_strahl_tippen'],
    ['g4_plus', 'g4_minus', 'g4_ueberschlag', 'plus_mit', 'minus_mit'],
    ['einmaleins', 'g4_mal', 'g4_teilen', 'g4_rest'],
    ['g4_groessen', 'zeit', 'geld_rechnen', 'geld_legen'],
    ['g4_sach', 'sachaufgaben', 'platzhalter', 'zahlenmauer'],
  ],
};
