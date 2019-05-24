const crypto = require('crypto');
const log4js = require('log4js');
const logger = log4js.getLogger();

const VERSION = 'v0';

function verificationService(secret) {

  const verifyRequest = function(timestamp, body, signature) {
    // TODO: make sure timestamp is recent
    const hmac = crypto.createHmac('sha256', secret);
    const sigBasestring = [VERSION, timestamp, body].join(':');
    hmac.update(sigBasestring);
    const sigExpected = VERSION + '=' + hmac.digest('hex');
    logger.debug(sigExpected);
    logger.debug(signature);
    let verified = false;
    try {
      verified = crypto.timingSafeEqual(Buffer.from(sigExpected), Buffer.from(signature));
    } catch (err) {
      logger.debug(err);
    }
    hmac.end();
    if (!verified) {
      logger.debug(`${sigExpected} did not match ${signature}`);
    }
    return verified;
  }

  const bodyParserVerify = function(req, res, buf, encoding) {
    logger.debug('verify slack');
    const timestamp = req.get('X-Slack-Request-Timestamp');
    const signature = req.get('X-Slack-Signature');
    const body = buf.toString(encoding);
    if (!verifyRequest(timestamp, body, signature)) {
      const msg = 'Could not verify the signature.';
      logger.error(msg);
      throw new Error(msg);
    }
  };

  return {
    _secret: secret,
    verifyRequest: verifyRequest,
    bodyParserVerify: bodyParserVerify
  };
}

const verificationSvc = verificationService(process.env.SLACK_SECRET);

module.exports = verificationSvc;
