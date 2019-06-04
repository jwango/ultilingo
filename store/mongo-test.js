// meant for interactive mode
// run node
// then run .load ./store/mongo-test.js

require('dotenv').config();
const mongoServiceFactory = require('../api/services/mongo-data.service');
const mongoService = mongoServiceFactory(process.env.MONGO_CONNECTION);