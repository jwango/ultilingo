const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const matcherSvc = require('./matcher.service');
const opResult = require('../helpers/op-result');
const log4js = require('log4js');
const logger = log4js.getLogger();

const DB = 'ultilingo';
const ENTRIES_COLLECTION = 'entries';

function wrapError(error) {
  if (error.isOpResult) {
    return error;
  } else {
    throw opResult(false, 500, error);
  }
}

function mongoDataService(connectionString) {
  const client = new MongoClient(connectionString, { useNewUrlParser: true });

  const _getClient = function() {
    if (!this._client.isConnected()) {
      return this._client.connect();
    }
    return Promise.resolve(this._client);
  }

  const getEntryIds = function() {
    return this._getClient()
      .then((client) => {
        return client
          .db(DB)
          .collection(ENTRIES_COLLECTION)
          .find({}, { "_id": 1 })
          .toArray()
          .then((entries) => {
            return entries.map((entry) => entry._id).sort();
          })
      });
  }

  const getEntry = function(entryName, flagThreshold, definitionsStartIndex, definitionsLimit) {
    const start = definitionsStartIndex || 0;
    const limit = definitionsLimit || undefined;
    let end = undefined;
    if (limit) {
      end = start + limit;
    }
    return this.getEntryIds()
      .then((entryIds) => {
        let matches = matcherSvc.exactMatch(entryIds, entryName);
        let entryId = null;
        if (matches.length === 0) {
          matches = matcherSvc.match(entryIds, entryName);
        } else {
          entryId = matches[0];
        }
        if (!entryId) {
          throw opResult(false, 404, null, matches);
        }
        return this._getClient()
          .then((client) => {
            return client
              .db(DB)
              .collection(ENTRIES_COLLECTION)
              .findOne({ "_id": entryId })
              .then((entry) => {
                if (!entry) {
                  return null;
                }
                return opResult(true, 200, null, {
                  ...entry,
                  definitions: entry.definitions
                    .filter((definition) => definition.flaggedCount < flagThreshold)
                    .slice(start, end)
                });
              });
          });
      })
      .catch(wrapError);
  };

  const addEntry = function(name, definitionValue, userInfo) {
    const entryId = matcherSvc.mapToEntryId(name);
    const today = new Date();
    return this._getClient()
      .then((client) => {
        return client
          .db(DB)
          .collection(ENTRIES_COLLECTION)
          .insertOne({
            _id: entryId,
            name: name,
            dateAdded: today.toISOString(),
            dateUpdated: today.toISOString(),
            definitions: [{
              _id: new ObjectId().toHexString(),
              dateAdded: today.toISOString(),
              dateUpdated: today.toISOString(),
              votes: 0,
              voteIds: [],
              userInfo: userInfo || {},
              flaggedCount: 0,
              value: definitionValue
            }]
          })
          .then(() => opResult(true));
      })
      .catch(wrapError);
  }

  const deleteEntry = function(entryId) {
    return this._getClient()
      .then((client) => {
        return client
          .db(DB)
          .collection(ENTRIES_COLLECTION)
          .deleteOne({ "_id": entryId })
          .then((result) => {
            if (!result) {
              throw opResult(false, 500, new Error('No result from delete.'));
            }
            if (result.modifiedCount == 0) {
              throw opResult(false, 404, new Error('Could not delete the given entry.'));
            }
            return opResult(true);
          });
      })
      .catch(wrapError);
  }

  const getDefinition = function(entryId, definitionId) {
    return this._getClient()
      .then((client) => {
        return client
          .db(DB)
          .collection(ENTRIES_COLLECTION)
          .findOne({ "_id": entryId, "definitions": { "$elemMatch": { "_id": definitionId } } })
          .then((entry) => {
            if (!entry || !entry.definitions) {
              return null;
            }
            return entry.definitions.find((definition) => definition._id == definitionId ) || null;
          });
      });
  }

  const addDefinition = function(value, entryName, userInfo) {
    const entryId = matcherSvc.mapToEntryId(entryName);
    const today = new Date();
    return this._getClient()
      .then((client) => {
        return client
          .db(DB)
          .collection(ENTRIES_COLLECTION)
          .updateOne(
            { "_id": entryId },
            {
              $set: { "dateUpdated": today.toISOString() },
              $push: { 
                "definitions": {
                  _id: new ObjectId().toHexString(),
                  dateAdded: today.toISOString(),
                  dateUpdated: today.toISOString(),
                  votes: 0,
                  voteIds: [],
                  userInfo: userInfo || {},
                  flaggedCount: 0,
                  value: value
                } 
              }
            }
          )
          .then(() => opResult(true));
      })
      .catch(wrapError);
  }

  const deleteDefinition = function(entryId, definitionId) {
    return this._getClient()
      .then((client) => {
        return client
          .db(DB)
          .collection(ENTRIES_COLLECTION)
          .updateOne(
            { "_id": entryId },
            {
              $pull: { "definitions": { "_id": definitionId } }
            }
          )
          .then((result) => {
            if (!result) {
              throw opResult(false, 500, new Error('No result from delete.'));
            }
            if (result.modifiedCount == 0) {
              throw opResult(false, 404, new Error('Could not delete the given definition.'));
            }
            return opResult(true);
          });
      })
      .catch(wrapError);
  }

  const flagDefinition = function(entryId, definitionId) {
    return this._getClient()
      .then((client) => {
        return client
          .db(DB)
          .collection(ENTRIES_COLLECTION)
          .updateOne(
            { "_id": entryId, "definitions._id": definitionId },
            { $inc: { "definitions.$.flaggedCount": 1 } }
          )
          .then(() => opResult(true));
      })
      .catch(wrapError);
  }

  const addVote = function(entryId, definitionId, ext, userId) {
    const extUserId = `${ext}.${userId}`;
    return this.getDefinition(entryId, definitionId)
      .then((definition) => {
        if (!definition) {
          throw opResult(false, 404, new Error('Definition does not exist.'));
        }
        if (definition.voteIds.indexOf(extUserId) !== -1) {
          throw opResult(false, 400, new Error('This vote has already been counted.'));
        }
        return this._getClient();
      })
      .then((client) => {
        return client
          .db(DB)
          .collection(ENTRIES_COLLECTION)
          .updateOne(
            { "_id": entryId, "definitions._id": definitionId },
            {
              $inc: { "definitions.$.votes": 1 },
              $push: { "definitions.$.voteIds": extUserId }
            }
          )
          .then(() => client);
      })
      .then((client) => {
        return client
          .db(DB)
          .collection(ENTRIES_COLLECTION)
          .updateOne(
            { "_id": entryId, "definitions._id": definitionId },
            { 
              $push: {
                "definitions": {
                  $each: [],
                  $sort: { "votes": -1 }
                }
              }
            }
          )
          .then(() => opResult(true));
      })
      .catch(wrapError);
  }

  // Public API
  return {
    _connectionString: connectionString,
    _client: client,
    _getClient: _getClient,
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

module.exports = mongoDataService;