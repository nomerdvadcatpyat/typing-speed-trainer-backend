const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const config = require('config');

const PORT = config.get("serverPort");
const DATABASE_URL = config.get("databaseURL")

const authRouter = require('./routes/auth.routes');
const cors = require('./middlewares/cors');


const app = express();

app.use(logger('dev'));
app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRouter);

(async () => {
  try {
    await mongoose.connect(DATABASE_URL);
    mongoose.Promise = global.Promise;

    app.listen(PORT, () => {
      console.log(`server start on ${PORT}`)
    });
  }
  catch (e) {
    console.log(e);
  }
})();


