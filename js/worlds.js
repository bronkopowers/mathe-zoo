// Die beiden Spielwelten. Jeder Ort gehört zu einem Mathe-Thema (Reihenfolge wie TOPICS in catalog.js)
// und erzählt in vier Schritten, was die gelösten Aufgaben in der Szene bewirken.

export const WORLDS = {
  zoo: {
    name: 'Der vergessene Zoo',
    tagline: 'Hinter einer alten Mauer schläft ein Zoo. Bring ihn wieder zum Leben!',
    places: [
      {
        id: 'tor', scene: 'zooTor', name: 'Das alte Tor',
        intro: 'Die Wasserpumpe am Tor steht still. Jede gelöste Aufgabe dreht sie ein Stück weiter.',
        steps: ['Es gluckert in den Rohren. Die erste Laterne brennt!', 'Wer schaut denn da über die Mauer?', 'Der Tank ist fast voll. Gleich hast du es!'],
        done: 'Das Tor ist offen. Die Giraffe hat wieder Wasser!',
      },
      {
        id: 'becken', scene: 'zooBecken', name: 'Das Pinguinbecken',
        intro: 'Das Becken ist leer und die Pinguine warten am Rand. Lass das Wasser laufen!',
        steps: ['Das Wasser läuft! Der Boden ist schon nass.', 'Das Becken ist halb voll. Die Pinguine werden zappelig.', 'Nur noch ein kleines Stück bis zum Rand!'],
        done: 'Platsch! Die Pinguine schwimmen wieder.',
      },
      {
        id: 'bahn', scene: 'zooBahn', name: 'Die Futterbahn',
        intro: 'Der Futterwagen steckt fest und der Elefant hat Hunger. Kurble ihn an!',
        steps: ['Der Wagen ruckelt los.', 'Halbe Strecke! Der Elefant hat ihn schon entdeckt.', 'Fast da. Der Rüssel zuckt schon.'],
        done: 'Das Futter ist da. Der Elefant trompetet vor Freude!',
      },
    ],
  },
  exp: {
    name: 'Die verschollene Stadt',
    tagline: 'Tief im Dschungel liegt eine Stadt aus Stein. Finde die Stücke der alten Karte!',
    places: [
      {
        id: 'tor', scene: 'expTor', name: 'Das Tor der Zahlen',
        intro: 'Das Steintor klemmt. Jede gelöste Aufgabe dreht die Zahnräder ein Stück weiter.',
        steps: ['Es knirscht im Gemäuer. Das Tor bewegt sich!', 'Ein Spalt ist offen. Dahinter schimmert etwas.', 'Noch ein Ruck, dann ist der Weg frei!'],
        done: 'Geschafft! Hinter dem Tor liegt ein Stück der alten Karte.',
      },
      {
        id: 'bruecke', scene: 'expBruecke', name: 'Die Hängebrücke',
        intro: 'Der Brücke fehlen alle Bretter. Mit jeder gelösten Aufgabe ziehst du neue auf die Seile.',
        steps: ['Die ersten Bretter liegen. Trau dich noch nicht!', 'Die Brücke reicht bis zur Mitte der Schlucht.', 'Nur noch die letzten Bretter fehlen.'],
        done: 'Die Brücke hält. Drüben wartet das nächste Kartenstück!',
      },
      {
        id: 'waage', scene: 'expWaage', name: 'Die Kammer der Waage',
        intro: 'Die goldene Figur ist zu schwer. Bring die Waage mit Steinen ins Gleichgewicht.',
        steps: ['Der erste Stein liegt. Die Waage zittert.', 'Der Balken hebt sich langsam.', 'Fast im Gleichgewicht!'],
        done: 'Die Waage steht still und die Wand gibt den Kompass frei!',
      },
    ],
  },
};
