// global helpers
const node = function(value, parent, isStr) {
  const n = {
    value: value,
    isStr: isStr,
    children: []
  };
  if (parent) {
    parent.children.push(n);
  }
  return n;
}

const _gatherHelper = function(root, node) {
  if (node.value) {
    root += node.value;
  }
  let results = [];
  // include substrings
  if (node.isStr) {
    results.push(root);
  }
  // base case
  if (node.children.length === 0) {
    return results;
  }
  // recurse over children
  for (let i = 0; i < node.children.length; i++) {
    results = results.concat(_gatherHelper(root, node.children[i]));
  }
  return results;
}

const gather = function(node) {
  return _gatherHelper('', node);
}

const _toStringPrefix = function(depth, branches) {
  if (depth <= 0) {
    return '';
  }
  let prefix = '';
  for (let i = 0; i < depth - 1; i += 1) {
    if (branches.indexOf(i) !== -1) {
      prefix += '| ';
    } else {
      prefix += '  ';
    }
  }
  prefix += '|-';
  return prefix;
}

const _toStringHelper = function(acc, node, depth, branches) {
  if (!node) {
    return '';
  }
  const c = node.value ? node.value : '*';
  acc += '\n' + _toStringPrefix(depth, branches) + c;
  for (let i = 0; i < node.children.length; i++) {
    let newBranches = [...branches];
    if (i < node.children.length - 1) {
      newBranches.push(depth);
    }
    acc = _toStringHelper(acc, node.children[i], depth + 1, newBranches);
  }
  return acc;
}

const toString = function(node) {
  return _toStringHelper('', node, 0, []);
}

// trie definition
const trie = function() {
  const root = node(null, undefined);
  const valueMatcher = function(val) {
    return function(node) {
      return node.value === val;
    };
  }

  const add = function(str) {
    let cur = this.root;
    let exists = true;
    for (let i = 0; i < str.length; i += 1) {
      const c = str.charAt(i);
      let next = cur.children.find(valueMatcher(c));
      if (!next) {
        next = node(c, cur);
        exists = false;
      }
      cur = next;
    }
    cur.isStr = true;
    return !exists;
  }

  const find = function(str) {
    let cur = this.root;
    let save = this.root;
    let i = 0;
    let res = '';
    while (i < str.length && cur) {
      const c = str.charAt(i);
      cur = cur.children.find(valueMatcher(c));
      if (cur) {
        res += c;
        save = cur;
      }
      i += 1;
    }
    return {
      exact: res,
      tail: save
    };
  }

  const trieToString = function() {
    return toString(this.root);
  }
  
  var instance = {};
  return Object.assign(instance, {
    root,
    add: add.bind(instance),
    find: find.bind(instance),
    toString: trieToString.bind(instance)
  });
}

// expose
module.exports = {
  node,
  toString,
  gather,
  build: trie
};