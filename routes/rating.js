const express = require('express');
const router = express.Router();
const User = require('../models/user');


router.get('/', async (req, res) => {
  const users = await User.find({ points: { $gt: 0 } });
  res.json(users.map(user => ({ username: user.email, points: user.points })));
});


module.exports = router;