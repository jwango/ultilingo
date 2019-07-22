const express = require('express');
const router = express.Router();
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
      .then(function() {
        res.status(201).end();
      })
      .catch(next);
  }
});

router.get('/:entryId', function(req, res, next) {
  const entryId = req.params['entryId'];
  dataSvc.getEntry(entryId, FLAG_THRESHOLD)
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

router.post('/:entryId/definitions/:definitionId/flags', function(req, res, next) {
  const entryId = req.params['entryId'];
  const definitionId = req.params['definitionId'];
  dataSvc.flagDefinition(entryId, definitionId)
    .then(function() {
      res.status(200).end();
    })
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
  dataSvc.addVote(entryId, definitionId)
    .then(function() {
      res.status(200).end();
    })
    .catch(next);
});

module.exports = router;
