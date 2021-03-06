const express = require('express');
const router = express.Router();
const User = require('../models/user');
const userTime = require('../models/userTime');

const options = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric'
};

router.get('/', async (req, res) => {
  const user = await User.findOne({ login: req.query.login });
  const userSessions = await userTime.find({ user: user });

  const {first, second, third} = get123PlacesCount(userSessions);

  res.json({
    graphicData: userSessions.map(session => ({ 
      date: session.startTime.toLocaleDateString("ru", options), 
      place: session.place, 
      points: session.points, 
      averageSpeed: Math.round(session.averageSpeed) 
    })),                
    userInfo: {
      login: user.login,
      points: user.points,
      averageSpeed: Math.round(user.averageSpeed),
      firstPlacesCount: first,
      secondPlacesCount: second,
      thirdPlacesCount: third
    }
  });
});


function get123PlacesCount(userSessions) {
  let first = 0, second = 0, third = 0;
  for(let session of userSessions) {
    switch(session.place) {
      case 1:
        ++first;
        break;
      case 2:
        ++second;
        break;
      case 3:
        ++third;
        break;
      default:
        break;
    }
  }

  return {first, second, third};
}

module.exports = router;