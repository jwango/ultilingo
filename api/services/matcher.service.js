function matcherService() {

  // returns the entryId for the given term
  const match = function(dict, term) {
    // TODO: write efficent binaryIndexOf method when assuming the entryIds are sorted
    const ndx = dict.entryIds.indexOf((term || "").toLowerCase());
    if (ndx >= 0) { 
      return dict.entryIds[ndx];
    }
    return null;
  };

  const mapToEntryId = function(entryName) {
    if (!entryName) {
      return null;
    }
    return entryName.toLowerCase();
  }

  // Public API
  return {
    mapToEntryId: mapToEntryId,
    match: match
  };
}

const matcherSvc = matcherService();

module.exports = matcherSvc;