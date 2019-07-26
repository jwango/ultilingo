const searchUtils = require('../helpers/search-utils');
const matcher = require('../../soundex/matcher');

function matcherService() {

  const _updateEntries = function(entryIds) {
    const newEntries = entryIds.filter(x => !_memoizedEntries.includes(x));
    newEntries.forEach((newEntry) => {
      this._matcher.add(newEntry, 'ENG');
      this._matcher.add(newEntry, 'FRE');
      _memoizedEntries.push(newEntry);
    });
  }

  // returns the entryId for the given term
  const simpleMatch = function(entryIds, term) {
    this._updateEntries(entryIds);
    const ndx = searchUtils.binaryIndexOf(entryIds, (term || "").toLowerCase());
    if (ndx >= 0) { 
      return [entryIds[ndx]];
    }
    return [];
  };

  const fuzzyMatch = function(entryIds, term) {
    this._updateEntries(entryIds);
    const result = {
      exact: '',
      matches: []
    };
    const resultENG = this._matcher.find(term, 'ENG');
    result.exact = resultENG.exact;
    result.matches = result.matches.concat(resultENG.matches);
    if (!result.exact) {
      const resultFRE = this._matcher.find(term, 'FRE');
      result.exact = resultFRE.exact;
      result.matches = result.matches.concat(resultFRE.matches.filter(x => !result.matches.includes(x)));
    }
    return result;
  }

  const mapToEntryId = function(entryName) {
    if (!entryName) {
      return null;
    }
    return entryName.toLowerCase();
  }

  const _memoizedEntries = [];
  const _matcher = matcher();

  // Public API
  let instance = {};
  instance = Object.assign(instance, {
    _matcher: _matcher,
    _memoizedEntries: _memoizedEntries,
    _updateEntries: _updateEntries,
    mapToEntryId: mapToEntryId,
    match: fuzzyMatch.bind(instance),
    exactMatch: simpleMatch.bind(instance)
  });
  return instance;
}

const matcherSvc = matcherService();

module.exports = matcherSvc;