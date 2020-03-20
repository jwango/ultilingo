const soundex = require('./soundex');
const trie = require('./trie');
const matcher = require('./matcher');

const test = function(s, word) {
  console.log(s.encode(word));
}
const testWords = [
  'censé',
  'sensé',
  'cane',
  'canne',
  'compte',
  'comte',
  'conte',
  'boulot',
  'bouleau',
  'date',
  'datte',
  'cric',
  'crique',
  'dessin',
  'dessein',
  'différend',
  'différent',
  'champ',
  'chant',
  'cygne',
  'signe',
  'ça',
  'basilic',
  'basilique',
  'd',
  'dvp',
  'dvpe',
  'dvper',
  'dvperer'
];

// test soundex
const sFre = soundex.Soundex('FRE');
const sEng = soundex.Soundex('ENG');
for (let i = 0; i < testWords.length; i++) {
  console.log(`\n${testWords[i]}:`)
  test(sFre, testWords[i]);
  test(sEng, testWords[i]);
}

// test trie
const t = trie.build();
t.add('testosterone');
t.add('testes');
t.add('tester');
console.log(JSON.stringify(t.find('tester')));
console.log(t.toString());
t.remove('testosteron');
console.log(t.toString());
t.remove('testes');
console.log(t.toString());

// test matcher integration of soundex + trie
/*const m = matcher(testWords);
const trieKeys = Object.keys(m.tries);
for (let i = 0; i < trieKeys.length; i += 1) {
  console.log(m.tries[trieKeys[i]].toString());
}
const findResult = m.find('censé', 'ENG');
console.log(JSON.stringify(findResult, null, 2));
console.log(m.remove('dvpe'));
console.log(m.remove('dvpe', 'FRE'));
for (let i = 0; i < trieKeys.length; i += 1) {
  console.log(m.tries[trieKeys[i]].toString());
}*/