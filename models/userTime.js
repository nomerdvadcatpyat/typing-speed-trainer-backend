const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserTime = Schema({
  gameSession: { type: Schema.Types.ObjectId, ref: 'GameSession' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  startTime: Date,
  endTime: Date,
  place: Number,
  points: Number,
  averageSpeed: Number
});

module.exports = mongoose.model('UserTime', UserTime);