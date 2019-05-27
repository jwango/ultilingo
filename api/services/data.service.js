const fs = require('fs');
const path = require('path');
const matcherSvc = require('./matcher.service');
const searchUtils = require('../helpers/search-utils');
const log4js = require('log4js');
const logger = log4js.getLogger();

const FLAG_THRESHOLD = +(process.env.FLAG_THRESHOLD);

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
  const getEntry = function(entryName, definitionsStartIndex, definitionsLimit) {
    const start = definitionsStartIndex || 0;
    const limit = definitionsLimit || undefined;
    return _read()
      .then(function(dict) {
        const entryId = matcherSvc.match(dict, entryName);
        const entry = dict.entries[entryId];
        if (!entry) {
          return null;
        }
        entry.definitions = [];
        entry.definitionIds
          .slice(start, start + limit)
          .forEach((definitionId) => {
            def = dict['definitions'][definitionId];
            if (def) {
              entry.definitions.push(def);
            }
          });
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
        const newDefinitionId = dict.latestDefinitionId + 1;
        dict.latestDefinitionId = newDefinitionId;
        dict.definitionIds.push(newDefinitionId);
        dict.definitions[newDefinitionId] = {
          id: newDefinitionId,
          dateAdded: today.toISOString(),
          dateUpdated: today.toISOString(),
          votes: 0,
          userInfo: userInfo || {},
          flaggedCount: 0,
          value: definitionValue
        };
        dict.entries[entryId] = {
          name: name,
          dateAdded: today.toISOString(),
          dateUpdated: today.toISOString(),
          definitionIds: [newDefinitionId],
          flaggedDefinitionIds: []
        };
        const insertNdx = searchUtils.binaryIndexOf(dict.entryIds, entryId, true);
        dict.entryIds.splice(insertNdx, 0, entryId);
        return this._write(dict);
      });
  }

  const getDefinitionIds = function() {
    return _read()
      .then(function(dict) {
        return dict.definitionIds;
      })
  }

  const getDefinition = function(definitionId) {
    return _read()
      .then(function(dict) {
        const definition = dict.definitions[definitionId];
        return definition || null;
      });
  }

  const addDefinition = function(value, entryName, userInfo) {
    return _read()
      .then((dict) => {
        const today = new Date();
        const newDefinitionId = dict.latestDefinitionId + 1;
        dict.latestDefinitionId = newDefinitionId;
        dict.definitionIds.push(newDefinitionId);
        dict.definitions[newDefinitionId] = {
          id: newDefinitionId,
          dateAdded: today.toISOString(),
          dateUpdated: today.toISOString(),
          votes: 0,
          userInfo: userInfo || {},
          flaggedCount: 0,
          value: value
        };

        const entryId = matcherSvc.mapToEntryId(entryName);
        if (entryId && dict.entries[entryId]) {
          dict.entries[entryId].definitionIds.push(newDefinitionId);
          dict.entries[entryId].dateUpdated = today.toISOString();
        }
        return this._write(dict);
      });
  }

  const flagDefinition = function(entryId, definitionId) {
    return _read()
      .then((dict) => {
        const entry = dict.entries[entryId];
        const today = new Date();
        if (!dict.definitions[definitionId] || !entry) {
          throw new Error('Definition could not be found for the given entry.');
        }
        dict.definitions[definitionId].dateUpdated = today.toISOString();
        dict.definitions[definitionId].flaggedCount += 1;
        if (dict.definitions[definitionId].flaggedCount >= FLAG_THRESHOLD) {
          entry.definitionIds = entry.definitionIds.filter((id) => +id !== +definitionId);
          entry.flaggedDefinitionIds.push(+definitionId);
        }
        return this._write(dict);
      });
  }

  const addVote = function(entryId, definitionId) {
    return _read()
      .then((dict) => {
        const today = new Date();
        if (!dict.definitions[definitionId]) {
          throw new Error('Definition does not exist.');
        }
        dict.definitions[definitionId].votes += 1;
        dict.definitions[definitionId].dateUpdated = today.toISOString();
        const entry = dict.entries[entryId];
        if (entry) {
          // optimized bubble sort the definition by votes
          let swapped = true;
          while (swapped) {
            swapped = false;
            const currNdx = entry.definitionIds.indexOf(definitionId);
            
            // check to the left and swap up if it has more votes
            if (currNdx > 0) {
              const leftDefinitionId = entry.definitionIds[currNdx - 1];
              if (dict.definitions[leftDefinitionId].votes <= dict.definitions[definitionId].votes) {
                _swap(entry.definitionIds, currNdx - 1, currNdx);
                swapped = true;
              }
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
    getDefinitionIds: getDefinitionIds,
    getDefinition: getDefinition,
    addDefinition: addDefinition,
    flagDefinition: flagDefinition,
    addVote: addVote
  };
}

const dataSvc = dataService();

module.exports = dataSvc;