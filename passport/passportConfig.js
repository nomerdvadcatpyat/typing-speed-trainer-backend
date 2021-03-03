const User = require('../models/user');
const bcrypt = require('bcryptjs');
const LocalStrategy = require('passport-local').Strategy;


module.exports = function(passport) {
  
  passport.use(new LocalStrategy({
    usernameField: 'login',
    passwordField: 'password'
  },
  (login, password, done) => {
    console.log(login, password);
    User.findOne({ login: login }, (err, user) => {
      if(err) throw err;
      if(!user) return done(null, false);
      bcrypt.compare(password, user.password, (err, result) => {
        if(err) throw err;
        if(result === true) {
          return done(null, user);
        }
        else {
          return done(null, false);
        }
      });
    });
  }));

  passport.serializeUser((user, cb) => {
    cb(null, user.id);
  });

  passport.deserializeUser((id, cb) => {
    User.findOne({ _id: id }, (err, user) => {
      const userInformation = {
        id: user._id,
        login: user.login
      }

      cb(err, userInformation);
    });
  });
}