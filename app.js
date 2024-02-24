
const express = require('express');
const path = require('path');
// const cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs = require('express-handlebars');
const session = require('express-session');
require('dotenv').config();
// db connection
const UFOdbdb = require('./config/connection');
const {catchError,errorHandler} = require('./middlewares/errorHandling');

const userRouter = require('./routes/user_routes/user');
const adminRouter = require('./routes/admin_routes/admin');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}));

const oneDay = 1000*60*60*24;
app.use(session({
  secret: process.env.SECRET_KEY,
  resave:false,
  saveUninitialized:true,
  cookie: {maxAge: oneDay}
}))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', userRouter);
app.use('/admin',adminRouter);


// catch 404 and forward to error handler
app.use(catchError);

// error handler
app.use(errorHandler);

module.exports = app;
