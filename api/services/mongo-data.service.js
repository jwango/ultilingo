const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const matcherSvc = require('./matcher.service');
const log4js = require('log4js');
const logger = log4js.getLogger();

const DB = 'ultilingo';
const ENTRIES_COLLECTION = 'entries';

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
            return entries.map((entry) => entry._id);
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
        const entryId = matcherSvc.match(entryIds, entryName);
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
                return {
                  ...entry,
                  definitions: entry.definitions
                    .filter((definition) => definition.flaggedCount < flagThreshold)
                    .slice(start, end)
                };
              });
          });
              
      });
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
              userInfo: userInfo || {},
              flaggedCount: 0,
              value: definitionValue
            }]
          });
      });
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
                  userInfo: userInfo || {},
                  flaggedCount: 0,
                  value: value
                } 
              }
            }
          );
      });
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
          );
      });
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
          );
      });
  }

  const addVote = function(entryId, definitionId) {
    return this._getClient()
      .then((client) => {
        return client
          .db(DB)
          .collection(ENTRIES_COLLECTION)
          .updateOne(
            { "_id": entryId, "definitions._id": definitionId },
            { $inc: { "definitions.$.votes": 1 } }
          )
          .then(() => {
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
          });
      });
    }

    // Public API
  return {
    _connectionString: connectionString,
    _client: client,
    _getClient: _getClient,
    getEntryIds: getEntryIds,
    getEntry: getEntry,
    addEntry: addEntry,
    getDefinition: getDefinition,
    addDefinition: addDefinition,
    deleteDefinition: deleteDefinition,
    flagDefinition: flagDefinition,
    addVote: addVote
  };
}

module.exports = mongoDataService;