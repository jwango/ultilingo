const dataSvc = require('./mock-data.service');
const mongoDataSvcFactory = require('./mongo-data.service');

let svc;
if (process.env.USE_MOCK_DATA == 'true') {
  svc = dataSvc;
} else {
svc = mongoDataSvcFactory(process.env.MONGO_CONNECTION);
}

module.exports = svc;