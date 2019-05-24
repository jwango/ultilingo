const fs = require('fs');
const path = require('path');
const matcherSvc = require('./matcher.service');
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
  const getEntry = function(entryName) {
    return _read()
      .then(function(dict) {
        const entryId = matcherSvc.match(dict, entryName);
        const entry = dict.entries[entryId];
        if (!entry) {
          return null;
        }
        entry.definitions = [];
        entry.definitionIds.forEach((definitionId) => {
          def = dict['definitions'][definitionId];
          if (def) {
            entry.definitions.push(def);
          }
        });
        entry.definitions.sort((a, b) => {
          return -1 * (a.votes - b.votes);
        });
        return entry;
      });
  }

  const addEntry = function(name, definitionValue) {
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
          value: definitionValue
        };
        dict.entries[entryId] = {
          name: name,
          dateAdded: today.toISOString(),
          dateUpdated: today.toISOString(),
          definitionIds: [newDefinitionId]
        };
        // TODO: write custom binaryIndexOf for efficient placement within array
        dict.entryIds.push(entryId);
        dict.entryIds.sort();
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

  const addDefinition = function(value, entryName) {
    return _read()
      .then((dict) => {
        const entryId = matcherSvc.mapToEntryId(entryName);
        const today = new Date();
        const newDefinitionId = dict.latestDefinitionId + 1;
        dict.latestDefinitionId = newDefinitionId;
        dict.definitionIds.push(newDefinitionId);
        dict.definitions[newDefinitionId] = {
          id: newDefinitionId,
          dateAdded: today.toISOString(),
          dateUpdated: today.toISOString(),
          votes: 0,
          value: value
        };

        if (entryId && dict.entries[entryId]) {
          dict.entries[entryId].definitionIds.push(newDefinitionId);
          dict.entries[entryId].dateUpdated = today.toISOString();
        }
        return this._write(dict);
      });
  }

  const addVote = function(definitionId) {
    return _read()
      .then((dict) => {
        const today = new Date();
        if (!dict.definitions[definitionId]) {
          throw new Error('Definition does not exist.');
        }
        dict.definitions[definitionId].votes += 1;
        dict.definitions[definitionId].dateUpdated = today.toISOString();
        return this._write(dict);
      });
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
    addVote: addVote
  };
}

const dataSvc = dataService();

module.exports = dataSvc;