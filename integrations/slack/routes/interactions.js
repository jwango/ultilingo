const express = require('express');
const rp = require('request-promise');
const log4js = require('log4js');
const logger = log4js.getLogger();

const dataSvc = require('../../../api/services/data.service');

const actions = require('../helpers/actions');
const formElements = require('../helpers/form-elements');
const dialogCreationSvc = require('../services/dialog-creation.service');

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

function sendMessage(responseUrl, messageStr, responseType) {
  const options = {
    method: 'POST',
    uri: responseUrl,
    body: {
        "response_type": responseType || "ephemeral",
        "text": messageStr
    },
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

function handleBlockActions(payload, req, res, next) {
  const triggerId = payload['trigger_id'];
  const responseUrl = payload['response_url'];
  // Do we need to loop through all the actions and handle each?
  const actionValue = payload['actions'][0]['value'];
  let actionId = payload['actions'][0]['action_id'];
  if(actionId.includes('UpVoteButton')) {
    actionId = 'UpVoteButton';
  }

  switch(actionId){
    case actions.UP_VOTE_BUTTON:
        onUpvote(payload, actionValue)
          .then(function(request) {
            res.status(200).end();
          });
    break;
    case actions.ADD_DEFINITION_BUTTON:
      onAddDefinition(triggerId, actionValue)
        .then(function(request) {
          res.status(200).end();
          // res.status(200).json(request); // for debugging
        });
    break;
    case actions.ADD_ENTRY_BUTTON:
      onAddEntry(triggerId, actionValue)
        .then(function(request) {
          res.status(200).end();
          // res.status(200).json(request); // for debugging
        })
        .catch(function(err) {
          logger.error(err);
          sendMessage(responseUrl, err.message);
          res.status(400).end();
        });
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

  let definitionValue;
  switch (callbackId) {
    case actions.ADD_DEFINITION_DIALOG:
      definitionValue = submission[formElements.DEFINITION_VALUE];
      dataSvc.addDefinition(definitionValue, state)
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
        logger.debug('add entry for ' + state + ': ' + definitionValue);
        dataSvc.addEntry(state, definitionValue)
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

function onUpvote(payload, actionValue) {
    const responseUrl = payload["response_url"];

    dataSvc.addVote(actionValue)
        .then(function(request) {
          return sendMessage(responseUrl, "Vote count has been updated");
        })
        .then(function() {
            res.status(201).end();
        })
        .catch(function(err) {
            logger.error(err);
            res.status(500).end();
        });;
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
  logger.debug(JSON.stringify(options, null, 2));
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

module.exports = router;