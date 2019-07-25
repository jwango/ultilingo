const express = require('express');
const router = express.Router();
const extensions = require('../helpers/extensions');
const dataSvc = require('../services/data.service');
const log4js = require('log4js');
const logger = log4js.getLogger();

const FLAG_THRESHOLD = +(process.env.FLAG_THRESHOLD);

/* GET entries listing. */
router.get('/', function(req, res, next) {
  dataSvc.getEntryIds()
    .then(function(entryIds) {
      res.json(entryIds);
    })
    .catch(next);
});

router.post('/', function(req, res, next) {
  const name = req.body['name'];
  const definition = req.body['definition'] || {};
  const value = definition['value'];

  if (!name) {
    res.status(400).send('Request body is missing a proper name.');
  } else if (!value) {
    res.status(400).send('Request body definition is missing a proper value.');
  } else {
    dataSvc.addEntry(name, value)
      .then(genResponseHandler(res, 201))
      .catch(next);
  }
});

router.get('/:entryId', function(req, res, next) {
  const entryId = req.params['entryId'];
  dataSvc.getEntry(entryId, FLAG_THRESHOLD)
    .then(genResponseHandler(res))
    .catch(next);
});

router.delete('/:entryId', function(req, res, next) {
  const entryId = req.params['entryId'];
  dataSvc.deleteEntry(entryId)
    .then(genResponseHandler(res))
    .catch(next);
});

router.get('/:entryId/definitions', function(req, res, next) {
  const entryId = req.params['entryId'];
  dataSvc.getEntry(entryId, FLAG_THRESHOLD)
    .then(function(entry) {
      if (!entry) {
        res.status(404).end();
      } else {
        res.json(entry.definitions);
      }
    })
    .catch(next);
});

router.post('/:entryId/definitions', function(req, res, next) {
  const entryId = req.params['entryId'];
  const value = req.body['value'];

  if (!value) {
    res.status(400).send('Request body is missing a proper value.');
  } else {
    dataSvc.addDefinition(value, entryId, { [extensions.API]: { id: res.locals.user } })
      .then(genResponseHandler(res, 201))
      .catch(next);
  }
});

router.get('/:entryId/definitions/:definitionId/flags', function(req, res, next) {
  const entryId = req.params['entryId'];
  const definitionId = req.params['definitionId'];

  dataSvc.getDefinition(entryId, definitionId)
    .then(function(definition) {
      if (definition) {
        res.json({
          "flaggedCount": definition.flaggedCount
        });
      } else {
        res.status(404).send('Could not find the definition for the given entry.');
      }
    })
    .catch(next);
});

router.get('/:entryId/definitions/:definitionId', function(req, res, next) {
  const entryId = req.params['entryId'];
  const definitionId = req.params['definitionId'];
  dataSvc.getDefinition(entryId, definitionId)
    .then(function(definition) {
      if (!definition) {
        res.status(404).send('Could not find the definition for the given entry.');
      } else {
        res.json(definition);
      }
    })
    .catch(next);
});

router.delete('/:entryId/definitions/:definitionId', function(req, res, next) {
  const entryId = req.params['entryId'];
  const definitionId = req.params['definitionId'];
  dataSvc.deleteDefinition(entryId, definitionId)
    .then(genResponseHandler(res))
    .catch(next);
});

router.post('/:entryId/definitions/:definitionId/flags', function(req, res, next) {
  const entryId = req.params['entryId'];
  const definitionId = req.params['definitionId'];
  dataSvc.flagDefinition(entryId, definitionId)
    .then(genResponseHandler(res))
    .catch(next);
});

router.get('/:entryId/definitions/:definitionId/votes', function(req, res, next) {
  const entryId = req.params['entryId'];
  const definitionId = req.params['definitionId'];

  dataSvc.getDefinition(entryId, definitionId)
    .then(function(definition) {
      if (definition) {
        res.json({
          "votes": definition.votes
        });
      } else {
        res.status(404).send('Could not find the definition for the given entry.');
      }
    })
    .catch(next);
});

router.post('/:entryId/definitions/:definitionId/votes', function(req, res, next) {
  const entryId = req.params['entryId'];
  const definitionId = req.params['definitionId'];
  dataSvc.addVote(entryId, definitionId, extensions.API, res.locals.user)
    .then(genResponseHandler(res))
    .catch(next);
});

function genResponseHandler(res, successCode) {
  return (opResult) => {
    if (opResult.success) {
      if (opResult.payload) {
        res.status(successCode || 200).json(opResult.payload);
      } else {
        res.status(successCode || 200).end();
      }
    } else {
      let msg = 'Something went wrong.';
      let statusCode = 500;
      if (opResult.statusCode) {
        statusCode = opResult.statusCode;
        msg = (opResult.error || {}).message || '';
      }
      if (opResult.payload) {
        res.status(statusCode).json(opResult.payload);
      } else {
        res.status(statusCode).send(msg);
      }
    }
  };
}

module.exports = router;
