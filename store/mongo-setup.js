require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(process.env.MONGO_CONNECTION, { useNewUrlParser: true });
const dict = require('../api/bin/dictionary.json');

const ENTRIES_COLLECTION = 'entries';

client.connect()
  .then((mongo) => {
    const db = mongo.db('ultilingo');
    console.log('Creating collection...');
    return db.createCollection(ENTRIES_COLLECTION)
      .then(() => {
        console.log('Inserting entries...');
        return db.collection(ENTRIES_COLLECTION).insertMany(
          dict.entryIds.map((entryId) => {
            const entry = dict.entries[entryId] || {};
            const definitions = entry.definitions.map((definition) => {
              const { id, ...noId } = definition;
              return noId;
            });
            return {
              _id: entry.name.toLowerCase(),
              name: entry.name,
              dateAdded: entry.dateAdded,
              dateUpdated: entry.dateUpdated,
              definitions: definitions
            };
          })
        );
      })
      .then(() => {
        console.log('Creating indexes...');
        const promises = [
          db.createIndex(ENTRIES_COLLECTION, { 'definitions.id': 1 }),
          db.createIndex(ENTRIES_COLLECTION, { 'definitions.votes:': -1 })
        ];
        return Promise.all(promises);
      });
  })
  .then(() => console.log('Completed!'))
  .catch(console.error)
  .then(() => {
    client.close();
    process.exit();
  });