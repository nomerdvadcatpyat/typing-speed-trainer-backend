const mongoose = require('mongoose');

const User = new mongoose.Schema({
    login: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    points: {
      type: Number,
      default: 0
    },
    averageSpeed: {
      type: Number,
      default: 0
    },
    gamesCount: {
      type: Number,
      default: 0
    }
})
 
module.exports = mongoose.model('User', User)