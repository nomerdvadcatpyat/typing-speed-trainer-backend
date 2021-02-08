const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {check, validationResult, body} = require('express-validator');
const validateRegistration = require('../middlewares/auth/validateRegistration');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config'); 
const authMiddleWare = require('../middlewares/auth/verifyJWT');

router.post('/registration', validateRegistration,
 async (req, res) => {
  try {
    if(req.errors) {
      console.log(req.errors);
      return res.status(400).json(req.errors);
    }

    const {email, password} = req.body;

    const candidate = await User.findOne({email})

    if(candidate) {
      console.log('is candidate', candidate);
      return res.status(400).json({message: `User with email ${email} already exist.`});
    }

    const hashPassword = await bcrypt.hash(password, 4);

    const user = await User.create({email, password: hashPassword});
    const token = jwt.sign({id: user._id}, config.get('secretKey'), {expiresIn: "1h"});

    console.log(user);

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
      }
    });

  } catch (e) {
    console.log(e);
    res.send({message: 'Server Error'});
  }
});



router.post('/login',
 async (req, res) => {
  try {

    const {email, password} = req.body;

    console.log(req.body)

    const user = await User.findOne({email});
    if (!user) {
      return res.status(404).json({message: "User not found"})
    }

    const isPassValid = bcrypt.compareSync(password, user.password);
    if(!isPassValid) {
      return res.status(400).json({message: "Password not valid"}); 
    }
    const token = jwt.sign({id: user._id}, config.get('secretKey'), {expiresIn: "1h"});

    console.log(user);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
      }
    });

  } catch (e) {
    console.log(e)
    res.send({message: 'Server Error'})
  }
});



router.get('/auth', authMiddleWare,
 async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const token = jwt.sign({id: user._id}, config.get('secretKey'), {expiresIn: "1h"});
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
      }
    });

  } catch (e) {
    console.log(e)
    res.send({message: 'Server Error'})
  }
});

module.exports = router;
