const express = require('express');
const Text = require('../models/text');
const Keyboard = require('../models/keyboard');
const Language = require('../models/language');
const router = express.Router();

const lengths = ['10', '100', '250', '500'];

router.get('/selectTextPageData', async (req, res) => {
  const response = await Text.find();
  const textTitles = response.map(doc => doc.title);

  res.json({
    textTitles,
    lengths
  });
});


module.exports = router;