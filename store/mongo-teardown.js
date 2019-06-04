require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(process.env.MONGO_CONNECTION, { useNewUrlParser: true });

const ENTRIES_COLLECTION = 'entries';

client.connect()
  .then((mongo) => {
    const db = mongo.db('ultilingo');
    console.log('Dropping collection...');
    return db.dropCollection(ENTRIES_COLLECTION);
  })
  .then(() => console.log('Completed!'))
  .catch(console.error)
  .then(() => {
    client.close();
    process.exit();
  });