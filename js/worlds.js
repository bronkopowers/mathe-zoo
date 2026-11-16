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
      {
        id: 'kiosk', scene: 'zooKiosk', name: 'Der alte Kiosk',
        intro: 'Der Kiosk ist seit Jahren verrammelt. Zieh den Rollladen Stück für Stück hoch!',
        steps: ['Der Rollladen bewegt sich. Die Markise fährt aus.', 'Halb offen! Drinnen raschelt etwas.', 'Noch ein Ruck, dann ist der Kiosk auf.'],
        done: 'Der Kiosk hat wieder geöffnet. Der Waschbär verkauft das erste Eis!',
      },
      {
        id: 'voliere', scene: 'zooVoliere', name: 'Die große Voliere',
        intro: 'Die Voliere ist völlig zugewachsen. Schneide die Ranken ab, damit die Vögel zurückkommen.',
        steps: ['Die erste Ranke fällt. Man sieht wieder Gitter.', 'Die halbe Voliere ist frei.', 'Nur noch eine Ranke hängt am Gitter.'],
        done: 'Die Voliere ist frei. Die Papageien sind zurück!',
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
      {
        id: 'boot', scene: 'expBoot', name: 'Der Flusshafen',
        intro: 'Das Boot muss beladen werden, bevor es ablegen kann. Jede gelöste Aufgabe hebt eine Kiste an Bord.',
        steps: ['Die erste Kiste steht an Deck.', 'Das halbe Boot ist beladen.', 'Noch eine Kiste, dann kann es losgehen.'],
        done: 'Leinen los! Das Boot bringt dich zum Tempelsteg.',
      },
      {
        id: 'spiegel', scene: 'expSpiegel', name: 'Die Halle der Spiegel',
        intro: 'Durch das Fenster fällt ein Lichtstrahl. Dreh die Spiegel, bis er den Kristall trifft.',
        steps: ['Der erste Spiegel fängt das Licht.', 'Der Strahl springt zur Decke.', 'Nur noch ein Spiegel fehlt bis zum Kristall.'],
        done: 'Der Kristall leuchtet und zeigt das letzte Stück der Karte!',
      },
    ],
  },
};
