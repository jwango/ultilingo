const searchUtils = require('../helpers/search-utils');
const FuzzySearch = require('fuzzy-search');

function matcherService() {

  // returns the entryId for the given term
  const simpleMatch = function(entryIds, term) {
    const ndx = searchUtils.binaryIndexOf(entryIds, (term || "").toLowerCase());
    if (ndx >= 0) { 
      return [entryIds[ndx]];
    }
    return [];
  };

  const fuzzyMatch = function(entryIds, term) {
    const searcher = new FuzzySearch(entryIds, [], { sort: true });
    const matches = searcher.search(term);
    return matches.slice(0, 3);
  }

  const mapToEntryId = function(entryName) {
    if (!entryName) {
      return null;
    }
    return entryName.toLowerCase();
  }

  // Public API
  return {
    mapToEntryId: mapToEntryId,
    match: fuzzyMatch,
    exactMatch: simpleMatch
  };
}

const matcherSvc = matcherService();

module.exports = matcherSvc;