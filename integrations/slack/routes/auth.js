const express = require('express');
const rp = require('request-promise');
const log4js = require('log4js');
const logger = log4js.getLogger();
const router = express.Router();

const oauthSvc = require('../services/oauth.service');

router.get('/callback', function(req, res) {
  // When a user authorizes an app, a code query parameter is passed on the oAuth endpoint. If that code is not there, we respond with an error message
  if (!req.query.code) {
    res.status(500);
    res.send({"Error": "Looks like we're not getting code."});
    logger.log("Looks like we're not getting code.");
  } else {
    // We'll do a GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret, and the code we just got as query parameters.
    return rp({
        url: 'https://slack.com/api/oauth.access',
        qs: {
          code: req.query.code,
          client_id: process.env.SLACK_CLIENT_ID || "clientId",
          client_secret: process.env.SLACK_CLIENT_SECRET || "clientSecret"
        },
        method: 'GET',
        json: true
    })
      .then(function (response) {
        res.json(response);
      })
      .catch(function (err) {
        logger.log(err);
      });
  }
});

router.get('/accessToken', function(req, res) {
  return oauthSvc
    .authenticate()
    .then(function (response) {
      res.send(response);
    });
});

module.exports = router;