const rp = require('request-promise');
const log4js = require('log4js');
const logger = log4js.getLogger();

function oauthService(clientId, redirectUri) {

  const authenticate = function() {
    return authorize(['identity.basic']);
  }

  const authorize = function(scopes) {
    return rp({
      url: 'https://slack.com/oauth/authorize',
      qs: {
        client_id: clientId,
        scope: scopes.join(' '),
        redirect_uri: redirectUri
      },
      method: 'GET',
      json: true
    })
      .then(function(res) {
        return res;
      })
      .catch(function(err) {
        logger.log(err);
        return err;
      });
  }

  const authTest = function(accessToken) {
    return rp({
      url: 'https://slack.com/api/auth.test',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      json: true
    })
      .then(function(res) {
        return res;
      })
      .catch(function(err) {
        logger.log(err);
        return err;
      });
  }

  return {
    _clientId: clientId,
    _redirectUri: redirectUri,
    authenticate: authenticate,
    authorize: authorize,
    authTest: authTest
  };
}

const oauthSvc = oauthService(process.env.SLACK_CLIENT_ID, process.env.SLACK_REDIRECT_URI);

module.exports = oauthSvc;
