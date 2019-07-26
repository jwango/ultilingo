const soundex = require('./soundex');
const trie = require('./trie');

const matcher = function(strings) {
  // define
  const _encode = function(str, lang) {
    return this.sndx.encode(str, {
      map: soundex.Maps[lang],
      reducer: soundex.Reducers[lang],
      skipFirst: soundex.SkipFirst[lang]
    });
  }

  const add = function(str, lang) {
    lang = lang || 'ENG';
    if (!this.tries[lang]) {
      return;
    }
    const val = _encode.call(this, str, lang);
    this.tries[lang].add(val);
    if (!this.dict[val]) {
      this.dict[val] = [];
    }
    this.dict[val].push(str);
  }

  const find = function(str, lang) {
    lang = lang || 'ENG';
    if (!this.tries[lang]) {
      return;
    }
    const val = _encode.call(this, str, lang);
    let results = [];
    const findResult = this.tries[lang].find(val);
    if (findResult.exact == '') {
      return {
        exact: '',
        matches: [],
        trieSearch: val,
        trieExact: '',
        trieMatches: []
      };
    }
    const trieResults = trie.gather(findResult.tail).map((res) => findResult.exact.slice(0, findResult.exact.length - 1) + res);
    for (let i = 0; i < trieResults.length; i++) {
      results = results.concat(this.dict[trieResults[i]] || []);
    }
    return {
      exact: results.find((res) => res === str),
      matches: results,
      trieSearch: val,
      trieExact: findResult.exact,
      trieMatches: trieResults
    };
  }

  // instantiate
  let instance = {};
  instance = Object.assign(instance, {
    add: add.bind(instance),
    find: find.bind(instance),
    tries: {
      'ENG': trie.build(),
      'FRE': trie.build()
    },
    dict: {},
    sndx: soundex.Soundex('ENG')
  });
  
  // initialize
  for (let i = 0; i < (strings || []).length; i++) {
    instance.add(strings[i], 'ENG');
    instance.add(strings[i], 'FRE');
  }

  // return
  return instance;
}

module.exports = matcher;