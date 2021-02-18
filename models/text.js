const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Text = Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  language: { type: Schema.Types.ObjectId, ref: 'Language' },
  title: String,
  text: String
});


module.exports = mongoose.model('Text', Text);