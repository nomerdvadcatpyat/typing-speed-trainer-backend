const express = require('express');
const router = express.Router();
const User = require('../models/user');
const validateRegistrationMiddleware = require('../middlewares/auth/validateRegistration');
const bcrypt = require('bcryptjs');
const passport = require('passport');

router.post('/registration', validateRegistrationMiddleware,
 async (req, res) => {
  try {
    const {login, password} = req.body;

    const candidate = await User.findOne({login})
    if(candidate) {
      console.log('is candidate', candidate);
      return res.status(400).json({error: `User with login ${login} already exist.`});
    }

    const hashPassword = await bcrypt.hash(password, 4);
    const user = await User.create({login, password: hashPassword});

    console.log(user);

    req.logIn(user, err => {
      if(err) throw err;
      res.json({
        user: {
          id: user._id,
          login: user.login,
        }
      });
    });



  } catch (e) {
    console.log(e);
    res.send({message: 'Server Error'});
  }
});



router.post('/login', async (req, res, next) => {
  try {
    passport.authenticate("local", (err, user, info) => {
      console.log('user', user);
      if(err) throw err;
      if (!user)
        return res.status(404).json({error: "User not found"})
      else {
        req.logIn(user, err => {
          if(err) throw err;
          res.json({
            user: {
              id: user._id,
              login: user.login,
            }
          });
        });
      }
    })(req, res, next);

  } catch (e) {
    console.log(e)
    res.json({message: 'Server Error'});
  }
});

router.get('/logout', (req, res) => {
  req.logOut();
  res.json({ ok: true });
});


router.get('/auth', (req, res, next) => {
  const user = req.user;
  console.log('auth', req.user);
  user ? res.json({ok: true, user}) : res.json({ ok: false });
});


module.exports = router;
