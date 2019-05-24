const express = require('express');
const router = express.Router();
const dataSvc = require('../services/data.service');

/* GET definitions listing. */
router.get('/', function(req, res, next) {
  dataSvc.getDefinitionIds()
    .then(function(definitionIds) {
      res.json(definitionIds);
    })
    .catch(next);
});

router.post('/', function(req, res, next) {
  const value = req.body['value'];

  if (!value) {
    res.status(400).send('Request body is missing a proper value property.');
  } else {
    dataSvc.addDefinition(value, null)
      .then(function() {
        res.status(201).end();
      })
      .catch(next);
  }
});

router.get('/:definitionId', function(req, res, next) {
  const definitionId = req.params['definitionId'];
  dataSvc.getDefinition(definitionId)
    .then(function (definition) {
      if (!definition) {
        res.status(404).end();
      } else {
        res.json(definition);
      }
    })
    .catch(next);
});

router.post('/:definitionId/votes', function(req, res, next) {
  const definitionId = req.params['definitionId'];
  dataSvc.addVote(definitionId)
    .then(function() {
      res.status(200).end();
    })
    .catch(next);
});

module.exports = router;
