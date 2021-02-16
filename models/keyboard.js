const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Keyboard = new Schema({
  language: { type: Schema.Types.ObjectId, ref: 'Language' },
  layout: [[Schema.Types.Mixed]]
});

module.exports = mongoose.model('Keyboard', Keyboard);
