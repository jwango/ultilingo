const searchUtils = require('../api/helpers/search-utils');

// global helpers
const node = function(value, isStr, parent, index) {
  const n = {
    value: value,
    isStr: isStr,
    children: []
  };
  if (parent) {
    searchUtils.arrInsert(parent.children, n, index);
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

const _toStringPrefix = function(depth, branches, isStr) {
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
  if (isStr) {
    prefix += '|>'
  } else {
    prefix += '|-';
  }
  return prefix;
}

const _toStringHelper = function(acc, node, depth, branches) {
  if (!node) {
    return '';
  }
  const c = node.value ? node.value : '*';
  acc += '\n' + _toStringPrefix(depth, branches, node.isStr) + c;
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
  const root = node(null, false);
  const _getNodeValue = function(node) {
    return node.value;
  }

  const _findChild = function(node, value, giveNearest) {
    let index = searchUtils.binaryIndexOf(node.children, value, {
      giveNearest: giveNearest,
      mapFn: _getNodeValue
    });
    return {
      index: index,
      node: node.children[index]
    };
  }

  const add = function(str) {
    let cur = this.root;
    let exists = true;
    for (let i = 0; i < str.length; i += 1) {
      const c = str.charAt(i);
      let childResult = _findChild(cur, c, true);
      let next = childResult.node || {};
      if (next.value !== c) {
        next = node(c, false, cur, childResult.index);
        exists = false;
      }
      cur = next;
    }
    cur.isStr = true;
    return !exists;
  }

  const _removeHelper = function(path) {
    if (!path || path.length <= 1) {
      return;
    }
    const tailNode = path.pop();
    const parent = path.pop();
    path.push(parent);
    if (tailNode.children.length === 0) {
      const childIndex = _findChild(parent, tailNode.value).index;
      parent.children.splice(childIndex, 1);
      _removeHelper(path);
    }
  }

  const remove = function(str) {
    let cur = this.root;
    let i = 0;
    let path = [this.root];
    let res = '';
    while (i < str.length && cur) {
      const c = str.charAt(i);
      cur = _findChild(cur, c).node;
      path.push(cur);
      if (cur) {
        res += c;
      }
      i += 1;
    }
    if (i === str.length && cur && cur.isStr) {
      cur.isStr = false;
      _removeHelper(path);
      return res;
    }
    return null;
  }

  const find = function(str) {
    let cur = this.root;
    let save = this.root;
    let i = 0;
    let res = '';
    while (i < str.length && cur) {
      const c = str.charAt(i);
      cur = _findChild(cur, c).node;
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
    remove: remove.bind(instance),
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