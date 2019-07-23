var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var log4js = require('log4js');

const verificationSvc = require('../integrations/slack/services/verification.service');
const oauthSvc = require('../integrations/slack/services/oauth.service');

const logLevel = process.env.LOG_LEVEL || 'WARN';
console.log(logLevel);
log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    everything: { type: 'file', filename: path.join(__dirname, '/public/run.log') }
  },
  categories: {
    default: { appenders: [ 'everything', 'out' ], level: logLevel }
  }
});
const logger = log4js.getLogger();

// General
var entriesRouter = require('./routes/entries');

// Slack
var slashRouter = require('../integrations/slack/routes/slash');
var interactionsRouter = require('../integrations/slack/routes/interactions');
var channelRouter = require('../integrations/slack/routes/channel');
var authRouter = require('../integrations/slack/routes/auth');

const slackVerify = function(req, res, buf, encoding) {
  const route = req.path.split('/');
  if (route.length > 0 && route[1] === 'slack') {
    verificationSvc.bodyParserVerify(req, res, buf, encoding);
  }
}

const apiGuard = function(req, res, next) {
  const tokens = (req.get('Authorization') || '').split('Bearer ');
  if (tokens[0] == "" && tokens.length > 1) {
    oauthSvc
      .authTest(tokens[1])
      .then(function(response) {
        if (!response || !response.ok) {
          res.status(403).send("Token failed.");
        } else {
          const toCheck = response.user_id;
          if (process.env.SLACK_ADMIN_WHITELIST.split(',').findIndex(function(value) { return toCheck === value; }) == -1) {
            res.status(403).send("This user does not have sufficient access.");
          } else {
            res.locals.user = toCheck;
            next();
          }
        }
      });
  } else {
    res.status(403).send("Invalid bearer token.");
  }
  
};

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(morgan('common'));
app.use(express.json({
  verify: slackVerify
}));
app.use(express.urlencoded({
  extended: false,
  verify: slackVerify
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.ENABLE_API == 'true') {
  app.use('/api/entries', apiGuard, entriesRouter);
}
app.use('/slack/slash', slashRouter);
app.use('/slack/interactions', interactionsRouter);
app.use('/slack/channel', apiGuard, channelRouter);
app.use('/slack/oauth', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
