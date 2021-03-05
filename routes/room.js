const express = require('express');
const Text = require('../models/text');
const Keyboard = require('../models/keyboard');
const Language = require('../models/language');
const router = express.Router();

const lengths = [ { value: '15', title: '15' }, 
                  { value: '100', title: '100' },
                  { value: '250', title: '250' },
                  { value: '500', title: '500' }];

router.get('/selectTextPageData', async (req, res) => {
  const response = await Text.find();
  const textTitles = response.map(doc => ({ value: doc.title, title: doc.title }));

  console.log(textTitles);

  res.json({
    textTitles,
    lengths
  });
});


module.exports = router;