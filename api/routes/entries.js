const express = require('express');
const router = express.Router();
const dataSvc = require('../services/data.service');
const log4js = require('log4js');
const logger = log4js.getLogger();

/* GET entries listing. */
router.get('/', function(req, res, next) {
  logger.debug('test log');
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
      .then(function() {
        res.status(201).end();
      })
      .catch(next);
  }
});

router.get('/:entryId', function(req, res, next) {
  const entryId = req.params['entryId'];
  dataSvc.getEntry(entryId)
    .then(function(entry) {
      if (!entry) {
        res.status(404).end();
      } else {
        res.json(entry);
      }
    })
    .catch(next);
});

router.get('/:entryId/definitions', function(req, res, next) {
  const entryId = req.params['entryId'];
  dataSvc.getEntry(entryId)
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
    dataSvc.addDefinition(value, entryId)
      .then(function() {
        res.status(201).end();
      })
      .catch(next);
  }
});

router.get('/:entryId/definitions/:definitionId/flags', function(req, res, next) {
  const entryId = req.params['entryId'];
  const definitionId = req.params['definitionId'];
  const p1 = dataSvc.getEntry(entryId, 0, 0);
  const p2 = dataSvc.getDefinition(definitionId);

  Promise.all([p1, p2])
    .then(function([entry, definition]) {
      if (entry && definition && (entry.definitionIds.concat(entry.flaggedDefinitionIds).includes(definition.id))) {
        res.json({
          "flagCount": definition.flaggedCount
        });
      } else {
        res.status(404).send('Could not find the definition for the given entry.');
      }
    })
    .catch(next);
});

router.post('/:entryId/definitions/:definitionId/flags', function(req, res, next) {
  const entryId = req.params['entryId'];
  const definitionId = req.params['definitionId'];
  dataSvc.flagDefinition(entryId, definitionId)
    .then(function() {
      res.status(200).end();
    })
    .catch(next);
});

module.exports = router;
