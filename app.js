require('dotenv').config()
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
var http = require('http');
const connectSocket = require('./sockets/soket');

const authRouter = require('./routes/auth');
const roomRouter = require('./routes/room');
const ratingRouter = require('./routes/rating');
const profileRouter = require('./routes/profile');
const cors = require('cors');
const passport = require('passport');

const app = express();

const DATABASE_URL = process.env.DATABASE_URL;
mongoose.connect(DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, () => console.log('Mongoose is connected'));
mongoose.Promise = global.Promise;

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.SESSION_SECRET)); 
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.DATABASE_URL })
  })  
);

app.use(passport.initialize());
app.use(passport.session());
require('./passport/passportConfig')(passport);



app.use('/api/auth', authRouter);
app.use('/api/trainingSpeed', roomRouter);
app.use('/api/rating', ratingRouter);
app.use('/api/profile', profileRouter);


var server = http.createServer(app);

connectSocket(server);

server.listen(process.env.PORT || 3001);

