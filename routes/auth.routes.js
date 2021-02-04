const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {check, body, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config'); 
const authMiddleWare = require('../middlewares/auth.middleware');

router.post('/registration',
  [
    check('email', 'Incorrect email').isEmail(),
    check('password', 'Password must be longer than 3 and shorter than 12').isLength({min: 3, max: 12}),
  ],
 async (req, res) => {
  try {
    const errors = validationResult(req);
    if(req.body.password !== req.body.rePassword) {
      errors.push({msg: "Пароли не совпадают"});
    }
    if(!errors.isEmpty()) {
      console.log(errors);
      return res.json(errors);
      // return res.status(404).json({message: "Incorrect request"});
    }

    const {email, password} = req.body;

    const candidate = await User.findOne({email})

    if(candidate) {
      return res.status(400).json({message: `User with email ${email} already exist.`})
    }

    const hashPassword = await bcrypt.hash(password, 4);
    await User.create({email, password: hashPassword});

    return res.json({message: 'User was created'});

  } catch (e) {
    console.log(e)
    res.send({message: 'Server Error'})
  }
});

router.post('/login',
 async (req, res) => {
  try {

    const {email, password} = req.body;

    const user = await User.findOne({email});
    if (!user) {
      return res.status(404).json({message: "User not found"})
    }

    const isPassValid = bcrypt.compareSync(password, user.password);
    if(!isPassValid) {
      return res.status(400).json({message: "Password not valid"}); 
    }
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
