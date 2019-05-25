const express = require('express');
const rp = require('request-promise');
const log4js = require('log4js');
const logger = log4js.getLogger();

const dataSvc = require('../../../api/services/data.service');

const messageCreationSvc = require('../services/message-creation.service');
const suggestionsSvc = require('../services/suggestions.service');

const router = express.Router();
const MAX_SUGGESTIONS = 3;

router.post('/ultilingo', function(req, res, next) {
  const wordToDefine = req.body['text'];
  const responseUrl = req.body['response_url'];
  const channelId = req.body['channel_id'];

  if (wordToDefine === 'contribute') {
    logger.debug(JSON.stringify(req.body, null, 2));
    suggestionsSvc.getAllSuggestions([channelId])
      .then(function (allSuggestions) {
        let promises = [];
        let finalResults = [];
        allSuggestions.forEach(suggestion => {
          promises.push(dataSvc.getEntry(suggestion));
        });
        return Promise.all(promises)
          .then(results => {
            for (let [i, result] of results.entries()) {
              if (!result) {
                finalResults.push(allSuggestions[i]);
              }
            }
            let finalSuggestions = finalResults.slice(-MAX_SUGGESTIONS);
            const blocks = messageCreationSvc.requestEntryMessage(finalSuggestions);
            const options = {
              method: 'POST',
              uri: responseUrl,
              body: {
                  "response_type": "ephemeral",
                  "blocks": blocks
              },
              json: true
            };
            return rp(options);
          });
      })
      .catch(next);
    res.json({
      "response_type": "ephemeral",
      "text": "Checking for words to contribute to in this channel..."
    });
  } else {
    dataSvc.getEntry(wordToDefine)
    .then(function (entry) {
      if(!entry){
          // return "dont have a this entry would you like to add it"
          const blocks = messageCreationSvc.createNotFoundMessage(wordToDefine);
          res.json({
              "blocks": blocks
          });
      }
      else {
          // return all of the defintions
          const blocks = messageCreationSvc.createDefinitionMessage(entry);
          res.json({
              "blocks": blocks
          });
      }
    })
    .catch(next);
  }
});

module.exports = router;
