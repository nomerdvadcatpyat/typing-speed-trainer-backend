const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const config = require('config');


const DATABASE_URL = config.get("databaseURL");
mongoose.connect(DATABASE_URL);
mongoose.Promise = global.Promise;

const authRouter = require('./routes/auth');
const roomRouter = require('./routes/room');
const ratingRouter = require('./routes/rating');

const cors = require('./middlewares/cors');

const app = express();

app.use(logger('dev'));
app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRouter);
app.use('/api/trainingSpeed', roomRouter);
app.use('/api/rating', ratingRouter);



module.exports = app;


