const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameSession = Schema({
  text: { type: Schema.Types.ObjectId, ref: 'Text' },
  isSingle: Boolean
});

module.exports = mongoose.Schema('GameSession', GameSession);