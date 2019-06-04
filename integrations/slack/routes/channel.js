const express = require('express');

const dataSvc = require('../../../api/services/data.service');

const messageCreationSvc = require('../services/message-creation.service');
const suggestionsSvc = require('../services/suggestions.service');

const router = express.Router();
const MAX_SUGGESTIONS = 3;
const FLAG_THRESHOLD = +(process.env.FLAG_THRESHOLD);

router.get('/', function(req, res, next) {

  suggestionsSvc.getAllChannels()
    .then(function (result) {
      // Comment out if you want the full response
      result = result.channels.map(({name, id}) => {
        return {name, id};
      })
      
      res.json(result);
    })
    .catch(next);
});

router.get('/suggest', async function(req, res, next) {

  suggestionsSvc.getAllSuggestions()
    .then(function (allSuggestions) {
      let promises = [];
      let finalResults = [];
      allSuggestions.forEach(suggestion => {
        promises.push(dataSvc.getEntry(suggestion, FLAG_THRESHOLD));
      });
      Promise.all(promises).then(results => {
        for (const [i, result] of results.entries()) {
          if (!result) {
            finalResults.push(allSuggestions[i]);
          }
        }
        let finalSuggestions = finalResults.slice(-MAX_SUGGESTIONS);
        const blocks = messageCreationSvc.requestEntryMessage(finalSuggestions);    
        res.json({
          "blocks": blocks
        });
      });
    })
    .catch(next);
  });

router.get('/:channelId/suggest', function(req, res, next) {
  const channelId = req.params['channelId'];

  suggestionsSvc.makeSuggestionsForChannel(channelId)
    .then(function (result) {
      res.json(result);
    })
    .catch(next);
});

module.exports = router;