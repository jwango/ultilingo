const actions = require('../helpers/actions');

function messageCreationService() {

  const createNotFoundMessage = function(word) {
      const text = 
        [{
            "type": "section",
            "text": {
                "type": "plain_text",
                "text": "An entry for " + word + " does not exist would you like to add one?",
                "emoji": true
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

    const createDefinitionMessage = function(entry) {
        let response = 
        [{
            "type": "section",
            "text": {
                "type": "plain_text",
                "text": "Found the follow definitions for " + entry.name +":",
                "emoji": true
            }
        }];
        for(let i = 0; i < entry.definitions.length; i++){
            const entryDefintion = 
            [{
                "type": "section",
                "text": {
                    "type": "plain_text",
                    "text": entry.definitions[i].value + " \n Votes: " + entry.definitions[i].votes,
                    "emoji": true
                },
                "accessory": {
                    "action_id": actions.UP_VOTE_BUTTON + i,
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Good Definition",
                        "emoji": true
                    },
                    "value": entry.definitions[i].id.toString()
                }
            }];

            response = response.concat(entryDefintion);
        }
          
        const addDefinition =
        [{
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
                }
            ]
        }];
        response = response.concat(addDefinition);
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