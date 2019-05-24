const fs = require('fs');
const path = require('path');
const rp = require('request-promise');
const log4js = require('log4js');
const logger = log4js.getLogger();

const STARTING_DICTIONARY = require('../../../api/helpers/starting-dictionary');

const SLACK_WEB_API = 'https://slack.com/api/';
const OAUTH_TOKEN = process.env.SLACK_USER_TOKEN;

function suggestionsService() {
  const _wordsFilePath = path.resolve(__dirname, '../../../api/bin/words_en.json');

  const _read = function() {
    return new Promise(function(resolve, reject) {
      fs.readFile(_wordsFilePath, function(err, data) {
        if (err) {
          logger.error(err);
          reject(err);
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
  };

  function getAllChannels() {
    const queryString = {
      'token': OAUTH_TOKEN,
    };
  
    const options = {
      uri: SLACK_WEB_API + 'conversations.list',
      qs: queryString,
      json: true
    };
    return rp(options)
  };

  function getAllSuggestions() {
    return getAllChannels()
    .then(function (channelResult) {
      ids = channelResult.channels.map(({id}) => {
        return id;
      });
      let promises = [];
      ids.forEach(id => {
        promises.push(suggestionsSvc.makeSuggestionsForChannel(id));
      });
      let finalResults = [];
      return Promise.all(promises).then(results => {
        results.forEach(result => {
          if (result) {
            Object.keys(result).forEach(key => {
              if(key >= 3) {
                let value = result[key];
                value.forEach(word => {
                  finalResults.push(word)
                })
              }
            });
          }
        });
        return finalResults;
      })
    })
  }

  function getHistoryByChannelId(id) {
    const queryString = {
      'token': OAUTH_TOKEN,
      'channel': id
    };
  
    const options = {
      uri: SLACK_WEB_API + 'conversations.history',
      qs: queryString,
      json: true
    };
    return rp(options)
  };

  const _checkWords = function(dictionary, wordsToCheck) {
    const unknownWords = {};
    const suggestionsByCount = {};
    wordsToCheck.forEach(word => {
      word = word.toLowerCase();
      if (dictionary.indexOf(word) === -1) {
        unknownWords[word] = (unknownWords[word] || 0) + 1;
      }
    });
    Object.keys(unknownWords).forEach(key => {
      let value = unknownWords[key];
      if (suggestionsByCount[value]) {
        suggestionsByCount[value].push(key)
      } else {
        suggestionsByCount[value] = [key];
      }
    });
    return suggestionsByCount;
  };

  const makeSuggestionsForChannel = function(id) {
    // If we have dictionary
    return _read()
      .then(function(dict) {
        dictionary = STARTING_DICTIONARY.concat(dict);
        // Get Channel History
        return getHistoryByChannelId(id)
          .then(function(response) {
            let messages = response.messages;
            let allWords = [];
            messages = messages.reduce((filtered, messageObj) => {  
              if (!messageObj.subtype && !messageObj.bot_id) {
                let message = messageObj.text;
                
                message = message.replace(/(w\/|<.*>|```.*```|`.*`|&[a-z]+;|:[^\s:]+:)/gi, '');
                message = message.replace(/[^a-z0-9 \n]+/gi, '');
                message = message.replace(/\s+/g, ' ');
                message = message.trim();  
                if (message && message.length > 1) {
                  filtered.push(message);
                  allWords = allWords.concat(message.split(' '));
                }
              }
              return filtered;
            }, []);
            return _checkWords(dictionary, allWords);
          })
          .catch(function(err) {
            logger.error(err);
            // maybe send a message back to slack from here
          });
      });
  }
  return {
    getAllChannels,
    getAllSuggestions,
    getHistoryByChannelId,
    makeSuggestionsForChannel
  }
}

const suggestionsSvc = suggestionsService();

module.exports = suggestionsSvc;