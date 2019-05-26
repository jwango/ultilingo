const express = require('express');
const rp = require('request-promise');
const log4js = require('log4js');
const logger = log4js.getLogger();

const dataSvc = require('../../../api/services/data.service');
const extensions = require('../../../api/helpers/extensions');

const actions = require('../helpers/actions');
const formElements = require('../helpers/form-elements');
const dialogCreationSvc = require('../services/dialog-creation.service');
const messageCreationSvc = require('../services/message-creation.service');

const SLACK_WEB_API = "https://slack.com/api/";
const BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

const router = express.Router();

router.post('/', function(req, res, next) {
  let payload = req.body['payload'];
  if (typeof payload === 'string') {
    payload = JSON.parse(payload);
  }
  logger.debug(JSON.stringify(payload, null, 2));
  const type = payload['type'];

  if (type === 'block_actions') {
    handleBlockActions(payload, req, res, next);
  } else if (type === 'dialog_submission') {
    handleDialogSubmission(payload, req, res, next);
  }
});

function sendBody(responseUrl, body, replaceOriginal, responseType) {
  const options = {
    method: 'POST',
    uri: responseUrl,
    body: Object.assign(body, {
      "replace_original": !!replaceOriginal,
      "response_type": responseType || "ephemeral",
    }),
    json: true
  };
  return rp(options)
    .then((body) => {
      if (!body["ok"]) {
        logger.debug(body);
      }
      return body;
    });
}

function sendMessage(responseUrl, messageStr, replaceOriginal, responseType) {
  return sendBody(responseUrl, { "text": messageStr }, replaceOriginal, responseType);
}

function handleBlockActions(payload, req, res, next) {
  const triggerId = payload['trigger_id'];
  const responseUrl = payload['response_url'];
  // Do we need to loop through all the actions and handle each?
  const actionValue = payload['actions'][0]['value'];
  let actionId = payload['actions'][0]['action_id'];
  if (actionId.includes(actions.UP_VOTE_BUTTON)) {
    actionId = actions.UP_VOTE_BUTTON;
  } else if (actionId.includes(actions.FLAG_DEFINITION_BUTTON)) {
    actionId = actions.FLAG_DEFINITION_BUTTON;
  }

  switch(actionId){
    case actions.UP_VOTE_BUTTON:
      onUpvote(responseUrl, actionValue)
        .catch(function(err) {
          logger.error(err);
        });
      res.status(200).end();
      break;
    case actions.ADD_DEFINITION_BUTTON:
      onAddDefinition(triggerId, actionValue)
        .catch(function(err) {
          logger.error(err);
        });
      res.status(200).end();
      break;
    case actions.ADD_ENTRY_BUTTON:
      onAddEntry(triggerId, actionValue)
        .catch(function(err) {
          logger.error(err);
          sendMessage(responseUrl, err.message, true);
        });
      res.status(200).end();
      break;
    case actions.FLAG_DEFINITION_BUTTON:
      onFlagDefinition(responseUrl, actionValue)
        .catch(function(err) {
          logger.error(err);
        });
      res.status(200).end();
      break;
    case actions.SHOW_MORE_DEFINITIONS_BUTTON:
      onShowMoreDefinitions(triggerId, responseUrl, actionValue)
        .catch(function(err) {
          logger.error(err);
        });
      res.status(200).end();
      break;
    default:
      res.status(404).end();
      break;
  }
}

function handleDialogSubmission(payload, req, res, next) {
  const callbackId = payload["callback_id"];
  const submission = payload["submission"];
  const state = payload["state"];
  const responseUrl = payload["response_url"];
  const user = payload["user"];

  let definitionValue;
  switch (callbackId) {
    case actions.ADD_DEFINITION_DIALOG:
      definitionValue = submission[formElements.DEFINITION_VALUE];
      dataSvc.addDefinition(definitionValue, state,  { ext: extensions.SLACK, id: user.id, name: user.username || user.name })
        .then(function() {
          const resp = sendMessage(
            responseUrl,
            "Your definition for " + state + " has been successfully added."
          );
          res.status(201).end();
          return resp;
        })
        .catch(function(err) {
          logger.error(err);
          res.status(500).end();
        });
      break;
    case actions.ADD_ENTRY_DIALOG:
      definitionValue = submission[formElements.DEFINITION_VALUE];
      dataSvc.addEntry(state, definitionValue, { ext: extensions.SLACK, id: user.id, name: user.username || user.name })
        .then(function() {
          const resp = sendMessage(
            responseUrl,
            "Your new entry " + state + " has been successfully added."
          );
          res.status(201).end();
          return resp;
        })
        .catch(function(err) {
          logger.error(err);
          res.status(500).end();
        });
      break;
    default:
      res.status(404).end();
      break;
  }
}

function onUpvote(responseUrl, actionValue) {
  const actionValueParsed = JSON.parse(actionValue);

  dataSvc.addVote(actionValueParsed.entryId, actionValueParsed.definitionId)
    .then(function() {
      return sendMessage(responseUrl, "Thanks for voting and improving our community!");
    });
}

function onAddDefinition(triggerId, entryName) {
  const dialog = dialogCreationSvc.createDialog(
    entryName + ":",
    actions.ADD_DEFINITION_DIALOG,
    [
      dialogCreationSvc.createTextAreaElement(
        "Definition",
        formElements.DEFINITION_VALUE,
        {
          "minLength": 0,
          "maxLength": 100,
        }
      )
    ]
  );
  const request = {
    "trigger_id": triggerId,
    "dialog": Object.assign(dialog, {
      "state": entryName
    })
  };

  const options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + BOT_TOKEN
    },
    uri: SLACK_WEB_API + 'dialog.open',
    body: request,
    json: true
  };
  return rp(options)
    .then(function(body) {
      if (!body["ok"]) {
        logger.debug(body);
      }
      return body;
    })
    .catch(function(err) {
      logger.error(err);
      // maybe send a message back to slack from here
    });
}

function onAddEntry(triggerId, entryName) {
  return dataSvc.getEntry(entryName)
    .then(function(entry) {
      if (entry) {
        throw Error('Entry already exists.');
      }
      const dialog = dialogCreationSvc.createDialog(
        entryName + ":",
        actions.ADD_ENTRY_DIALOG,
        [
          dialogCreationSvc.createTextAreaElement(
            "Definition",
            formElements.DEFINITION_VALUE,
            {
              "minLength": 0,
              "maxLength": 100,
            }
          )
        ]
      );
      const request = {
        "trigger_id": triggerId,
        "dialog": Object.assign(dialog, {
          "state": entryName
        })
      };

      const options = {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + BOT_TOKEN
        },
        uri: SLACK_WEB_API + 'dialog.open',
        body: request,
        json: true
      };
      return rp(options)
        .then(function(body) {
          if (!body["ok"]) {
            logger.debug(body);
          }
          return body;
        })
        .catch(function(err) {
          logger.error(err);
          // maybe send a message back to slack from here
        });
    });
}

function onFlagDefinition(responseUrl, actionValue) {
  const actionValueParsed = JSON.parse(actionValue);

  dataSvc.flagDefinition(actionValueParsed.entryId, actionValueParsed.definitionId)
    .then(function() {
      return sendMessage(responseUrl, "Definition has been flagged. Thanks for improving our community!");
    });
}

function onShowMoreDefinitions(triggerId, responseUrl, actionValue) {
  const actionValueParsed = JSON.parse(actionValue);
  dataSvc.getEntry(actionValueParsed.entryId, actionValueParsed.startNdx, 3)
    .then(function (entry) {
      if(!entry || entry.definitions.length === 0){
        return sendMessage(responseUrl, `Cannot find anymore definitions for ${entry.name}.`);
      }
      else {
        // return all of the defintions
        const blocks = messageCreationSvc.createDefinitionMessage(entry, actionValueParsed.startNdx);
        return sendBody(responseUrl, { "blocks": blocks }, true);
      }
    })
}

module.exports = router;