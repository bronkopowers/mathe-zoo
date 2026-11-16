// Belohnungen: Für verdiente Münzen sucht sich das Kind Stücke für seine Sammlung aus.
// Zoo: Tiere für die Gehege. Verschollene Stadt: Ausrüstung, Fundstücke und Dschungeltiere.

const it = (g, id, e, name, price) => ({ g, id, e, name, price });

export const SHOPS = {
  zoo: {
    button: 'Meine Tiere',
    title: 'Meine Tiere',
    mine: 'In deinem Zoo',
    coin: 'Futter-Münzen',
    empty: 'Noch wohnt hier kein Tier. Such dir unten dein erstes aus!',
    tip: 'Tippe auf ein Tier, um es zu füttern. Lange drücken, um ihm einen Namen zu geben.',
    moved: 'ist in deinen Zoo eingezogen!',
    treats: ['❤️', '🍎', '🥕', '🐟', '🌿'],
    rare: [it('rare', 'r_einhorn', '🦄', 'Einhorn', 0), it('rare', 'r_drache', '🐉', 'Drache', 0), it('rare', 'r_dino', '🦕', 'Langhals-Dino', 0), it('rare', 'r_trex', '🦖', 'T-Rex', 0), it('rare', 'r_pfau', '🦚', 'Pfau', 0), it('rare', 'r_kaenguru', '🦘', 'Känguru', 0), it('rare', 'r_panda', '🐼', 'Panda', 0), it('rare', 'r_koala', '🐨', 'Koala', 0)],
    groups: [
      { id: 'hof', name: 'Streichelzoo' }, { id: 'sav', name: 'Savanne' }, { id: 'dsch', name: 'Dschungel' },
      { id: 'wasser', name: 'Wasserwelt' }, { id: 'polar', name: 'Polarwelt' }, { id: 'nacht', name: 'Nachthaus' },
    ],
    items: [
      it('hof', 'huhn', '🐓', 'Huhn', 5), it('hof', 'schaf', '🐑', 'Schaf', 8), it('hof', 'ziege', '🐐', 'Ziege', 10), it('hof', 'schwein', '🐖', 'Schwein', 12), it('hof', 'kuh', '🐄', 'Kuh', 15), it('hof', 'pony', '🐴', 'Pony', 20),
      it('sav', 'zebra', '🦓', 'Zebra', 20), it('sav', 'giraffe', '🦒', 'Giraffe', 30), it('sav', 'nashorn', '🦏', 'Nashorn', 35), it('sav', 'nilpferd', '🦛', 'Nilpferd', 40), it('sav', 'elefant', '🐘', 'Elefant', 50), it('sav', 'loewe', '🦁', 'Löwe', 60),
      it('dsch', 'papagei', '🦜', 'Papagei', 18), it('dsch', 'affe', '🐒', 'Affe', 25), it('dsch', 'schlange', '🐍', 'Schlange', 25), it('dsch', 'faultier', '🦥', 'Faultier', 35), it('dsch', 'leopard', '🐆', 'Leopard', 45), it('dsch', 'orang', '🦧', 'Orang-Utan', 55),
      it('wasser', 'flamingo', '🦩', 'Flamingo', 15), it('wasser', 'schildkroete', '🐢', 'Schildkröte', 20), it('wasser', 'krake', '🐙', 'Krake', 30), it('wasser', 'delfin', '🐬', 'Delfin', 45), it('wasser', 'hai', '🦈', 'Hai', 55),
      it('polar', 'pinguin', '🐧', 'Pinguin', 15), it('polar', 'robbe', '🦭', 'Robbe', 30), it('polar', 'eisbaer', '🐻‍❄️', 'Eisbär', 60),
      it('nacht', 'igel', '🦔', 'Igel', 12), it('nacht', 'eule', '🦉', 'Eule', 20), it('nacht', 'fledermaus', '🦇', 'Fledermaus', 25), it('nacht', 'waschbaer', '🦝', 'Waschbär', 30),
    ],
  },
  exp: {
    button: 'Meine Funde',
    title: 'Meine Funde',
    mine: 'In deiner Expeditionskiste',
    coin: 'Goldstücke',
    empty: 'Die Kiste ist noch leer. Such dir unten dein erstes Stück aus!',
    tip: 'Tippe auf ein Stück, um es zu polieren. Lange drücken, um ihm einen Namen zu geben.',
    moved: 'liegt jetzt in deiner Kiste!',
    treats: ['✨', '⭐', '💫'],
    rare: [it('rare', 'r_pokal', '🏆', 'Goldpokal', 0), it('rare', 'r_kugel', '🔮', 'Zauberkugel', 0), it('rare', 'r_schwert', '🗡️', 'Altes Schwert', 0), it('rare', 'r_schild', '🛡️', 'Schild', 0), it('rare', 'r_maske', '🎭', 'Maske', 0), it('rare', 'r_ring', '💍', 'Ring', 0), it('rare', 'r_adler', '🦅', 'Adler', 0), it('rare', 'r_drache', '🐉', 'Steindrache', 0)],
    groups: [{ id: 'aus', name: 'Ausrüstung' }, { id: 'fund', name: 'Fundstücke' }, { id: 'tier', name: 'Dschungeltiere' }],
    items: [
      it('aus', 'seil', '🪢', 'Seil', 5), it('aus', 'lampe', '🔦', 'Lampe', 8), it('aus', 'kompass', '🧭', 'Kompass', 10), it('aus', 'karte', '🗺️', 'Landkarte', 12), it('aus', 'fernrohr', '🔭', 'Fernrohr', 20), it('aus', 'zelt', '⛺', 'Zelt', 25), it('aus', 'kanu', '🛶', 'Kanu', 35),
      it('fund', 'knochen', '🦴', 'Knochen', 8), it('fund', 'krug', '🏺', 'Tonkrug', 15), it('fund', 'schluessel', '🗝️', 'Schlüssel', 18), it('fund', 'muenze', '🪙', 'Goldmünze', 20), it('fund', 'rolle', '📜', 'Schriftrolle', 22), it('fund', 'urne', '⚱️', 'Urne', 30), it('fund', 'steinkopf', '🗿', 'Steinkopf', 40), it('fund', 'kristall', '💎', 'Kristall', 45), it('fund', 'dreizack', '🔱', 'Dreizack', 50), it('fund', 'krone', '👑', 'Krone', 60),
      it('tier', 'frosch', '🐸', 'Frosch', 8), it('tier', 'falter', '🦋', 'Falter', 10), it('tier', 'echse', '🦎', 'Echse', 12), it('tier', 'papagei', '🦜', 'Papagei', 18), it('tier', 'affe', '🐒', 'Affe', 25), it('tier', 'schlange', '🐍', 'Schlange', 25), it('tier', 'faultier', '🦥', 'Faultier', 35), it('tier', 'jaguar', '🐆', 'Jaguar', 55),
    ],
  },
};
