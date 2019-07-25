const invertMap = function(map) {
  const result = {};
  const keys = Object.keys(map);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    for (let j = 0; j < map[key].length; j++) {
      result[map[key][j]] = key;
    }
  }
  return result;
}

const Maps = {
  ENG: invertMap({
    '1': ['b', 'f', 'p', 'v'],
    '2': ['c', 'ç', 'g', 'j', 'k', 'q', 's', 'x', 'z'],
    '3': ['d', 't'],
    '4': ['l'],
    '5': ['m', 'n'],
    '6': ['r']
  }),
  FRE: invertMap({
    '1': ['un', 'ein', 'in', 'ain'],
    '2': ['en', 'an', 'am', 'amp_', 'ant_', 'end_', 'ent_'],
    '3': ['on', 'om'],
    'A': ['a', 'à', 'â'],
    'B': ['b', 'bb'],
    'C': ['ch'],
    'D': ['d', 'dd'],
    'E': ['e', 'eu'],
    'É': ['ê', 'é', 'è', 'ai', 'ei', 'et_', 'ee_', 'ée_'],
    'F': ['f', 'ff', 'ph'],
    'G': ['gu'],
    'I': ['î', 'i', 'y', 'ille'],
    'J': ['j', 'ge'],
    'K': ['k', 'qu', 'ck', 'c', 'c_', 'que_'],
    'L': ['l', 'll'],
    'M': ['m', 'mm'],
    'N': ['n', 'nn', 'gn', 'ne_', 'nne_', 'gne_'],
    'O': ['o', 'ô', 'eau', 'ot_'],
    'P': ['p', 'pp'],
    'R': ['r', 'rr'],
    'S': ['s', 'ss', 'ç', 'ce'],
    'T': ['t', 'tt', 'pt', 'te_', 'tte_', 'pt_', 'pte_'],
    'V': ['v', 'w'],
    'Z': ['z'],
    'U': ['ou', 'u', 'ù', 'û'],
    'S2': ['cen'],
    'K3': ['con', 'com'],
    'SE': ['ce']
  })
};

const Reducers = {
  ENG: (word) => {
    const drop = ['a', 'à', 'â', 'e', 'ê', 'é', 'è', 'i', 'î', 'o', 'ô', 'u', 'ù', 'û', 'y', 'h', 'w'];
    // reduce
    let i = 0;
    while (i < word.length - 1) {
      const cur = word.charAt(i);
      const next = word.charAt(i + 1);
      // handle adjacents (direct, or sep by 'h' or 'w')
      if (cur === next) {
        word = word.slice(0, i + 1) + word.slice(i + 2);
      } else if (i < word.length - 2) {
        const after = word.charAt(i + 2);
        if (cur == after && (next == 'h' || next == 'w')) {
          word = word.slice(0, i + 1) + word.slice(i + 3);
        }
      }
      i += 1;
    }
    // drop other letters except the first
    let newWord = word.charAt(0);
    i = 1;
    while (i < word.length) {
      if (drop.indexOf(word.charAt(i)) === -1) {
        newWord += word.charAt(i);
      }
      i += 1;
    }
    return newWord;
  },
  FRE: (word) => word.toLowerCase()
};

const SkipFirst = {
  ENG: true,
  FRE: false
};

const Soundex = function(defaultLang) {

  // sort by length, descending
  const _keySort = function(a, b) {
    if (a && b) {
      return a.length > b.length ? -1 : (a.length < b.lastIndexOf ? 1 : 0);
    } else if (a) {
      return -1;
    } else if (b) {
      return 1;
    } else {
      return 0;
    }
  }

  const _getOrDefault = function(dict, key, def) {
    const res = dict[key];
    if (res == undefined) {
      return def;
    }
    return res;
  }

  const encode = function(word, options) {
    options = options || {
      map: _getOrDefault(Maps, this.defaultLang, Maps['ENG']),
      reducer: _getOrDefault(Reducers, this.defaultLang, Reducers['ENG']),
      skipFirst: _getOrDefault(SkipFirst, this.defaultLang, SkipFirst['ENG'])
    };

    // append special char for end of string
    let result = word.toLowerCase() + '_';
    let first = result.charAt(0);
    if (options.skipFirst) {
      result = result.slice(1);
    }
    
    // replace with our tokens, larger matches first
    const mapKeys = Object.keys(options.map).sort(_keySort);
    for (let i = 0; i < mapKeys.length; i++) {
      const key = mapKeys[i].toLowerCase();
      const regex = new RegExp(key, 'g');
      result = result.replace(regex, options.map[key].toUpperCase());
    }

    if (options.skipFirst) {
      result = first + result;
    }
    result = options.reducer(result);
    // remove special end of string char
    if (result.charAt(result.length - 1) == '_') {
      return result.slice(0, -1);
    }
    return result;
  };

  const instance = {};
  return Object.assign(instance, {
    defaultLang: defaultLang,
    encode: encode.bind(instance)
  });
}

module.exports = {
  Maps,
  Reducers,
  SkipFirst,
  Soundex,
  invertMap
};