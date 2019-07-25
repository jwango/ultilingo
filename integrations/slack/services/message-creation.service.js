const actions = require('../helpers/actions');
const matcherSvc = require('../../../api/services/matcher.service');
const log4js = require('log4js');
const logger = log4js.getLogger();

function messageCreationService() {

  const createNotFoundMessage = function(word, suggestions) {
      let resp = "An entry for " + word + " does not exist.";
      if (suggestions && suggestions.length > 0) {
        resp += " Here are some suggestions:";
        for (let i = 0; i < Math.min(suggestions.length, 3); i++) {
          resp += "\n- " + suggestions[i];
        }
      }
      resp += "\n Or would you like to add this entry?";
      const text = 
        [{
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": resp
            }
        }];
      const button = 
        [{
            "type": "actions",
            "elements": [
                {
                    "action_id": actions.ADD_ENTRY_BUTTON,
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Add Entry",
                        "emoji": true
                    },
                    "value": word
                }
            ]
        }];

        return text.concat(button);
    }

    const createDefinitionMessage = function(entry, startNdx) {
      const maxRange = startNdx + entry.definitions.length;
      const minRange = Math.min(startNdx + 1, maxRange);
        let response = 
        [{
            "type": "section",
            "text": {
                "type": "plain_text",
                "text": `Found the following definitions (${minRange}-${maxRange}) for ${entry.name}:`,
                "emoji": true
            }
        }];
        for(let i = 0; i < entry.definitions.length; i++){
          const entryDefintion = [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "verbatim": false,
                "text": `${startNdx + i + 1}. ${entry.definitions[i].value} \n Votes: ${entry.definitions[i].votes}`
              }
            },
            {
              "type": "actions",
              "elements": [
                {
                  "action_id": actions.UP_VOTE_BUTTON + i,
                  "type": "button",
                  "text": {
                      "type": "plain_text",
                      "text": "Good 👍",
                      "emoji": true
                  },
                  "value": JSON.stringify({
                    entryId: matcherSvc.mapToEntryId(entry.name),
                    definitionId: entry.definitions[i]._id.toString()
                  })
                },
                {
                  "action_id": actions.FLAG_DEFINITION_BUTTON + i,
                  "type": "button",
                  "text": {
                      "type": "plain_text",
                      "text": "Flag ❗",
                      "emoji": true
                  },
                  "value": JSON.stringify({
                    entryId: matcherSvc.mapToEntryId(entry.name),
                    definitionId: entry.definitions[i]._id.toString()
                  })
                },
              ]
            }
          ];

          response = response.concat(entryDefintion);
        }
          
        const moreButtons = {
          "type": "actions",
          "elements": [
            {
              "action_id": actions.ADD_DEFINITION_BUTTON,
              "type": "button",
              "text": {
                  "type": "plain_text",
                  "text": "Add Definition",
                  "emoji": true
              },
              "value": entry.name
            },
            {
              "action_id": actions.SHOW_MORE_DEFINITIONS_BUTTON,
              "type": "button",
              "text": {
                  "type": "plain_text",
                  "text": "Show More",
                  "emoji": true
              },
              "value": JSON.stringify({
                entryId: entry.name,
                startNdx: startNdx + entry.definitions.length
              })
            }
          ]
        };
        response.push(moreButtons);
        return response;
    }

    const requestEntryMessage = function(words) {
        let response =
        [{
            "type": "section",
            "text": {
                "type": "plain_text",
                "text": "These words show up a lot, but aren't defined in Ulti Lingo yet. Are you familiar with any of them?",
                "emoji": true
            }
        }]
        words.forEach(word => {
            const entryDefintion =
            [{
                "type": "section",
                "text": {
                    "type": "plain_text",
                    "text": word,
                    "emoji": true
                },
                "accessory": {
                    "action_id": actions.ADD_ENTRY_BUTTON,
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Add Entry",
                        "emoji": true
                    },
                    "value": word
                }
            }]
            response = response.concat(entryDefintion);
        });
        return response;
    }

    // Public API
    return {
        createNotFoundMessage,
        createDefinitionMessage,
        requestEntryMessage
    };
}

const messageCreationSvc = messageCreationService();

module.exports = messageCreationSvc;