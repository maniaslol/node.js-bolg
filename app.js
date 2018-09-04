var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
// var csrf = require('csurf');
// var bodyParser = require('body-parser')
var flash = require('connect-flash');
var favicon = require('serve-favicon');

var indexRouter = require('./routes/index');
var dashboardRouter = require('./routes/dashboard');

var app = express();

// setup route middlewares
// var csrfProtection = csrf({ cookie: true })
// var parseForm = bodyParser.urlencoded({ extended: false })

// view engine setup
app.engine('ejs', require('express-ejs-extend'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  // cookie: {maxAge:600*1000}
}));


app.use('/', indexRouter);
app.use('/dashboard', dashboardRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  // next(createError(404));
  let signinResult = req.session.signinResult
  let category="";
  let categoryID="";
  const title="該頁面不存在"
  res.render('error',{title,category,categoryID,signinResult});
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  let signinResult = req.session.signinResult
  let category="";
  let categoryID="";
  const title="該頁面不存在"
  res.render('error',{title,category,categoryID,signinResult});
});

module.exports = app;
