const fs = require('fs');
const path = require('path');
const matcherSvc = require('./matcher.service');
const searchUtils = require('../helpers/search-utils');
const opResult = require('../helpers/op-result');
const log4js = require('log4js');
const logger = log4js.getLogger();

function wrapError(error) {
  if (error.isOpResult) {
    return error;
  } else {
    throw opResult(false, 500, error);
  }
}

function dataService() {
  // Private
  const _dictFilePath = path.resolve(__dirname, '../bin/dictionary.json');

  const _read = function() {
    return new Promise(function(resolve, reject) {
      fs.readFile(_dictFilePath, function(err, data) {
        if (err) {
          logger.error(err);
          reject(err);
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
  }

  const _writeHelper = function() {
    if (this._writeQ.length > 0) {
      const reqObj = this._writeQ.shift();
      logger.log('[W] POP');
      return new Promise(function(resolve, reject) {
        fs.writeFile(_dictFilePath, JSON.stringify(reqObj, null, 2), function(err) {
          if (err) {
            logger.error(err);
          }
          resolve();
        });
      }).then(() => {
        return this._writeHelper();
      });
    }
    this._writePrev = null;
    return null;
  }

  const _write = function(obj) {
    this._writeQ.push(obj);
    logger.log('[W] PUSH');
    if (!this._writePrev) {
      this._writePrev = this._writeHelper();
    }
    return this._writePrev;
  }

  // Public
  const getEntryIds = function() {
    return _read()
      .then(function(dict) {
        return dict.entryIds;
      });
  }

  // gets entry with a fuzzy search using matcher
  const getEntry = function(entryName, flagThreshold, definitionsStartIndex, definitionsLimit) {
    const start = definitionsStartIndex || 0;
    const limit = definitionsLimit || undefined;
    let end = undefined;
    if (limit) {
      end = start + limit;
    }
    return _read()
      .then(function(dict) {
        const entryId = matcherSvc.match(dict.entryIds, entryName);
        const entry = dict.entries[entryId];
        if (!entry) {
          return null;
        }
        entry.definitions = entry.definitions
          .filter((definition) => definition.flaggedCount < flagThreshold)
          .slice(start, end);
        return entry;
      });
  }

  const addEntry = function(name, definitionValue, userInfo) {
    return _read()
      .then((dict) => {
        const entryId = matcherSvc.mapToEntryId(name);
        if (dict.entries[entryId]) {
          throw opResult(false, 400, new Error("Entry already exists."));
        }
        const today = new Date();
        dict.entries[entryId] = {
          name: name,
          dateAdded: today.toISOString(),
          dateUpdated: today.toISOString(),
          definitionsCounter: 1,
          definitions: [
            {
              _id: 0,
              dateAdded: today.toISOString(),
              dateUpdated: today.toISOString(),
              votes: 0,
              userInfo: userInfo || {},
              flaggedCount: 0,
              value: definitionValue
            }
          ]
        };
        const insertNdx = searchUtils.binaryIndexOf(dict.entryIds, entryId, { giveNearest: true });
        dict.entryIds.splice(insertNdx, 0, entryId);
        return this._write(dict).then(() => opResult(true));
      })
      .catch(wrapError);
  }

  const deleteEntry = function(entryId) {
    return _read()
      .then((dict) => {
        if (!dict.entries[entryId]) {
          throw opResult(false, 404, new Error('Could not find the given entry.'));
        }
        const index = searchUtils.binaryIndexOf(dict.entryIds, entryId, { giveNearest: false });
        if (index === -1) {
          throw opResult(false, 404, new Error('Could not find the given entry.'));
        }
        dict.entryIds.splice(index, 1);
        dict.entries[entryId] = undefined;
        return this._write(dict).then(() => true);
      })
      .catch(wrapError);
  }

  const getDefinition = function(entryId, definitionId) {
    return _read()
      .then(function(dict) {
        return dict.entries[entryId].definitions[definitionId] || null;
      });
  }

  const addDefinition = function(value, entryName, userInfo) {
    return _read()
      .then((dict) => {
        const today = new Date();
        const entryId = matcherSvc.mapToEntryId(entryName);
        const entry = dict.entries[entryId];
        const newDefinitionId = entry.definitionsCounter;
        entry.definitions.push({
          _id: newDefinitionId.toString(),
          dateAdded: today.toISOString(),
          dateUpdated: today.toISOString(),
          votes: 0,
          voteIds: [],
          userInfo: userInfo || {},
          flaggedCount: 0,
          value: value
        });
        entry.dateUpdated = today.toISOString();
        entry.definitionsCounter += 1;
        return this._write(dict).then(() => opResult(true));
      })
      .catch(wrapError);
  }

  const deleteDefinition = function(entryId, definitionId) {
    return _read()
      .then((dict) => {
        if (!dict.entries[entryId]) {
          throw opResult(false, 404, new Error('Could not find the given entry.'));
        }

        const index = searchUtils.binaryIndexOf(
          dict.entries[entryId].definitions,
          definitionId,
          {
            giveNearest: false,
            mapFn: function (definition) {
              return definition._id;
            }
          }
        );

        if (index === -1) {
          throw opResult(false, 404, new Error('Definition could not be found for the given entry.'));
        }

        dict.entries[entryId].definitions.splice(index, 1);
        dict.entries[entryId].definitionsCounter -= 1;
        return this._write(dict).then(() => opResult(true));
      })
      .catch(wrapError);
  }

  const flagDefinition = function(entryId, definitionId) {
    return _read()
      .then((dict) => {
        const entry = dict.entries[entryId] || { definitions: [] };
        const definition = entry.definitions.find((definition) => definition._id == definitionId);
        const today = new Date();
        if (!definition) {
          throw opResult(false, 404, new Error('Definition could not be found for the given entry.'));
        }
        definition.dateUpdated = today.toISOString();
        definition.flaggedCount += 1;
        return this._write(dict).then(() => opResult(true));
      })
      .catch(wrapError);
  }

  const addVote = function(entryId, definitionId, ext, userId) {
    return _read()
      .then((dict) => {
        const entry = dict.entries[entryId] || { definitions: [] };
        const definition = entry.definitions.find((definition) => definition._id == definitionId);
        const today = new Date();
        if (!definition) {
          throw opResult(false, 404, new Error('Definition could not be found for the given entry.'));
        }
        const extUserId = `${ext}.${userId}`
        if (definition.voteIds.indexOf(extUserId) !== -1) {
          throw opResult(false, 400, new Error('This vote has already been counted.'));
        }
        definition.dateUpdated = today.toISOString();
        definition.voteIds.push(extUserId);
        definition.votes += 1;
        // optimized bubble sort the definition by votes
        let swapped = true;
        while (swapped) {
          swapped = false;
          const currNdx = entry.definitions.findIndex((definition) => definition._id == definitionId);
          
          // check to the left and swap up if it has more votes
          if (currNdx > 0) {
            if (entry.definitions[currNdx - 1].votes <= entry.definitions[currNdx].votes) {
              _swap(entry.definitions, currNdx - 1, currNdx);
              swapped = true;
            }
          }
        }
        return this._write(dict).then(() => opResult(true));
      })
      .catch(wrapError);
  }

  const _swap = function(arr, i, j) {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  // Public API
  return {
    _write: _write,
    _writeHelper: _writeHelper,
    _writePrev: null,
    _writeQ: [],
    getEntryIds: getEntryIds,
    getEntry: getEntry,
    addEntry: addEntry,
    deleteEntry: deleteEntry,
    getDefinition: getDefinition,
    addDefinition: addDefinition,
    deleteDefinition: deleteDefinition,
    flagDefinition: flagDefinition,
    addVote: addVote
  };
}

const dataSvc = dataService();

module.exports = dataSvc;