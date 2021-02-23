const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameSession = Schema({
  id: String,
  textTitle: String,
  length: Number,
  isSingle: Boolean
});

module.exports = mongoose.model('GameSession', GameSession);