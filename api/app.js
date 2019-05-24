var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var log4js = require('log4js');

const verificationSvc = require('../integrations/slack/services/verification.service');

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
var indexRouter = require('./routes/index');
var entriesRouter = require('./routes/entries');
var definitionsRouter = require('./routes/definitions');

// Slack
var slashRouter = require('../integrations/slack/routes/slash');
var interactionsRouter = require('../integrations/slack/routes/interactions');
var channelRouter = require('../integrations/slack/routes/channel');

function verify(req, res, buf, encoding) {
  const route = req.path.split('/');
  logger.debug(route);
  if (route.length > 0 && route[1] === 'slack') {
    verificationSvc.bodyParserVerify(req, res, buf, encoding);
  }
}

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(morgan('common'));
app.use(express.json({
  verify: verify
}));
app.use(express.urlencoded({
  extended: false,
  verify: verify
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/entries', entriesRouter);
app.use('/definitions', definitionsRouter);
app.use('/slack/slash', slashRouter);
app.use('/slack/interactions', interactionsRouter);
app.use('/slack/channel', channelRouter);

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
