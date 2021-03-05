const express = require('express');
const router = express.Router();
const User = require('../models/user');

const options = [{value: "points", title: "Количество очков"}, {value: "averageSpeed", title: "Средняя скорость"}];

router.get('/ratingOptions', async (req, res) => {
  res.json(options);
});


router.get('/', async (req, res) => {
  const users = await User.find({ points: { $gt: 0 } });
  console.log(req.query);
  const mappedUsers = users.map(user => ({ username: user.login, points: user.points, averageSpeed: Math.round(user.averageSpeed), gamesCount: user.gamesCount }));

  let resJson;
  switch(req.query.filter) {
    case 'points': {
      resJson = mappedUsers.sort((user1, user2) => user1.points < user2.points ? 1 : -1);
      console.log('switch points')
      break;
    }
    case 'averageSpeed': {
      resJson = mappedUsers.sort((u1, u2) => u1.averageSpeed < u2.averageSpeed ? 1 : -1);
      console.log('switch as')
      break;
    }
  }
                      
  console.log(resJson);

  res.json(resJson);
});


module.exports = router;