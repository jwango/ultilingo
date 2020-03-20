const matcher = require('./matcher');
const STARTING_DICTIONARY = require('../api/helpers/starting-dictionary');
const WORDS_EN = require('../api/bin/words_en.json');

const testFind = function(m, word, verbose) {
  const label = `Find ${word}`;
  console.time(label)
  const resENG = m.find(word, 'ENG');
  const resFRE = m.find(word, 'FRE');
  console.timeEnd(label);
  if (verbose) {
    console.log(resENG.exact);
    console.log(resFRE.exact);
    console.log();
  }
}

const testRemove = function(m, word, verbose) {
  const label = `Remove ${word}`;
  console.time(label)
  const resENG = m.remove(word, 'ENG');
  const resFRE = m.remove(word, 'FRE');
  console.timeEnd(label);
  if (verbose) {
    console.log(resENG);
    console.log(resFRE);
    console.log();
  }
}

console.time('Init');
const words = WORDS_EN.concat(STARTING_DICTIONARY).slice(0);
console.log(words.length);
m = matcher(words);
console.timeEnd('Init');

console.time('Find all');
for (let i = 0; i < 100; i++) {
  const ndx = Math.floor(Math.random() * words.length);
  testFind(m, words[ndx]);
}
console.timeEnd('Find all');

console.log('------');

console.time('Remove all');
for (let i = 0; i < 100; i++) {
  const ndx = Math.floor(Math.random() * words.length);
  testRemove(m, words[ndx]);
}
console.timeEnd('Remove all');