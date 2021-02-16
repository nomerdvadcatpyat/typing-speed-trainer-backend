const mongoose = require('mongoose');


const Language = new mongoose.Schema({
  name: {
      type: String,
      required: true
  }
})

module.exports = mongoose.model('Language', Language)