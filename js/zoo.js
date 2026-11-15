// Tier-Katalog. Normale Tiere kauft man mit Futter-Münzen,
// Meister-Tiere bekommt man nur, wenn man ein Thema gemeistert hat.

export const HABITATS = [
  { id: 'bauernhof', name: 'Streichelzoo', bg: '#e9f5d0', border: '#9cc65a' },
  { id: 'savanne', name: 'Savanne', bg: '#fbe8b8', border: '#e2b04a' },
  { id: 'dschungel', name: 'Dschungel', bg: '#cdeccf', border: '#4fa35a' },
  { id: 'wasser', name: 'Wasserwelt', bg: '#cfe9fb', border: '#4a9fe2' },
  { id: 'polar', name: 'Polarwelt', bg: '#eef6fb', border: '#9cc3dc' },
  { id: 'nacht', name: 'Nachthaus', bg: '#d9d3f0', border: '#7d6cc4' },
];

export const ANIMALS = [
  { id: 'huhn', e: '🐓', name: 'Huhn', h: 'bauernhof', price: 5 },
  { id: 'schaf', e: '🐑', name: 'Schaf', h: 'bauernhof', price: 8 },
  { id: 'ziege', e: '🐐', name: 'Ziege', h: 'bauernhof', price: 10 },
  { id: 'schwein', e: '🐖', name: 'Schwein', h: 'bauernhof', price: 12 },
  { id: 'kuh', e: '🐄', name: 'Kuh', h: 'bauernhof', price: 15 },
  { id: 'pferd', e: '🐴', name: 'Pony', h: 'bauernhof', price: 20 },
  { id: 'zebra', e: '🦓', name: 'Zebra', h: 'savanne', price: 20 },
  { id: 'giraffe', e: '🦒', name: 'Giraffe', h: 'savanne', price: 30 },
  { id: 'nashorn', e: '🦏', name: 'Nashorn', h: 'savanne', price: 35 },
  { id: 'nilpferd', e: '🦛', name: 'Nilpferd', h: 'savanne', price: 40 },
  { id: 'elefant', e: '🐘', name: 'Elefant', h: 'savanne', price: 50 },
  { id: 'loewe', e: '🦁', name: 'Löwe', h: 'savanne', price: 60 },
  { id: 'papagei', e: '🦜', name: 'Papagei', h: 'dschungel', price: 18 },
  { id: 'affe', e: '🐒', name: 'Affe', h: 'dschungel', price: 25 },
  { id: 'schlange', e: '🐍', name: 'Schlange', h: 'dschungel', price: 25 },
  { id: 'faultier', e: '🦥', name: 'Faultier', h: 'dschungel', price: 35 },
  { id: 'leopard', e: '🐆', name: 'Leopard', h: 'dschungel', price: 45 },
  { id: 'orang', e: '🦧', name: 'Orang-Utan', h: 'dschungel', price: 55 },
  { id: 'flamingo', e: '🦩', name: 'Flamingo', h: 'wasser', price: 15 },
  { id: 'schildkroete', e: '🐢', name: 'Schildkröte', h: 'wasser', price: 20 },
  { id: 'krake', e: '🐙', name: 'Krake', h: 'wasser', price: 30 },
  { id: 'delfin', e: '🐬', name: 'Delfin', h: 'wasser', price: 45 },
  { id: 'hai', e: '🦈', name: 'Hai', h: 'wasser', price: 55 },
  { id: 'pinguin', e: '🐧', name: 'Pinguin', h: 'polar', price: 15 },
  { id: 'robbe', e: '🦭', name: 'Robbe', h: 'polar', price: 30 },
  { id: 'eisbaer', e: '🐻‍❄️', name: 'Eisbär', h: 'polar', price: 60 },
  { id: 'igel', e: '🦔', name: 'Igel', h: 'nacht', price: 12 },
  { id: 'eule', e: '🦉', name: 'Eule', h: 'nacht', price: 20 },
  { id: 'fledermaus', e: '🦇', name: 'Fledermaus', h: 'nacht', price: 25 },
  { id: 'waschbaer', e: '🦝', name: 'Waschbär', h: 'nacht', price: 30 },
];

// Ein Meister-Tier pro Thema
export const MASTER_ANIMALS = {
  stellenwert: { e: '🦄', name: 'Einhorn' },
  nachbarzahlen: { e: '🦘', name: 'Känguru' },
  ordnen: { e: '🦚', name: 'Pfau' },
  zahlenstrahl: { e: '🦢', name: 'Schwan' },
  plus_ohne: { e: '🐼', name: 'Panda' },
  minus_ohne: { e: '🐨', name: 'Koala' },
  plus_mit: { e: '🐉', name: 'Drache' },
  minus_mit: { e: '🦖', name: 'T-Rex' },
  zahlenmauer: { e: '🦕', name: 'Langhals-Dino' },
  zahlenfolgen: { e: '🦊', name: 'Fuchs' },
  fachbegriffe: { e: '🦤', name: 'Dodo' },
  einmaleins: { e: '🐯', name: 'Tiger' },
  teilen: { e: '🦦', name: 'Otter' },
  geld_umrechnen: { e: '🐿️', name: 'Eichhörnchen' },
  geld_rechnen: { e: '🦙', name: 'Lama' },
  sachaufgaben: { e: '🐳', name: 'Wal' },
};

export const animalById = (id) => ANIMALS.find((a) => a.id === id);

export const PRAISE = [
  'Super gerechnet!', 'Stark!', 'Genau richtig!', 'Klasse!', 'Gut überlegt!', 'Prima!', 'Spitze!', 'Das sitzt!',
];
export const PRAISE_RETRY = ['Gut, dass du es nochmal versucht hast!', 'Drangeblieben, super!', 'Jetzt hast du es!'];
export const ENCOURAGE = ['Fehler sind zum Lernen da.', 'Beim nächsten Mal klappt es besser.', 'Schau dir den Weg genau an.'];
