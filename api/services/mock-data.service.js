const fs = require('fs');
const path = require('path');
const matcherSvc = require('./matcher.service');
const searchUtils = require('../helpers/search-utils');
const log4js = require('log4js');
const logger = log4js.getLogger();

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
          // TODO: change response to not be an error since this generates a 500
          logger.error('Entry ' + entryId + ' already exists!')
          throw new Error("Entry already exists!");
        }
        const today = new Date();
        dict.entries[entryId] = {
          name: name,
          dateAdded: today.toISOString(),
          dateUpdated: today.toISOString(),
          definitionsCounter: 1,
          definitions: [
            {
              id: 0,
              dateAdded: today.toISOString(),
              dateUpdated: today.toISOString(),
              votes: 0,
              userInfo: userInfo || {},
              flaggedCount: 0,
              value: definitionValue
            }
          ]
        };
        const insertNdx = searchUtils.binaryIndexOf(dict.entryIds, entryId, true);
        dict.entryIds.splice(insertNdx, 0, entryId);
        return this._write(dict);
      });
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
          id: newDefinitionId,
          dateAdded: today.toISOString(),
          dateUpdated: today.toISOString(),
          votes: 0,
          userInfo: userInfo || {},
          flaggedCount: 0,
          value: value
        });
        entry.dateUpdated = today.toISOString();
        entry.definitionsCounter += 1;
        return this._write(dict);
      });
  }

  const flagDefinition = function(entryId, definitionId) {
    return _read()
      .then((dict) => {
        const entry = dict.entries[entryId] || { definitions: [] };
        const definition = entry.definitions.find((definition) => definition._id == definitionId);
        const today = new Date();
        if (!definition) {
          throw new Error('Definition could not be found for the given entry.');
        }
        definition.dateUpdated = today.toISOString();
        definition.flaggedCount += 1;
        return this._write(dict);
      });
  }

  const addVote = function(entryId, definitionId) {
    return _read()
      .then((dict) => {
        const entry = dict.entries[entryId] || { definitions: [] };
        const definition = entry.definitions.find((definition) => definition._id == definitionId);
        const today = new Date();
        if (!definition) {
          throw new Error('Definition could not be found for the given entry.');
        }
        definition.dateUpdated = today.toISOString();
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
        return this._write(dict);
      });
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
    getDefinition: getDefinition,
    addDefinition: addDefinition,
    flagDefinition: flagDefinition,
    addVote: addVote
  };
}

const dataSvc = dataService();

module.exports = dataSvc;