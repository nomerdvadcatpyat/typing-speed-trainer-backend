const express = require('express');
const Text = require('../models/text');
const Language = require('../models/language');
const User = require('../models/user');
const Keyboard = require('../models/keyboard');
const router = express.Router();

const lengths = ['100', '250', '500'];

router.get('/selectTextPageData', async (req, res) => {
  const response = await Text.find();
  const textTitles = response.map(doc => ({ id: doc._id, title: doc.title }));
  console.log(textTitles);

  res.json({
    textTitles,
    lengths
  });
});

router.get('/selectTextData', async (req, res) => {
  console.log(req.query);

});

router.get('/prepare', async (req, res) => {
  console.log('prepareGet');
  await setTimeout(() => res.json({ ok: true }), 5000);
});


router.get('/text', async (req, res) => {
  try {
    const title = req.query.title;
    const text = await Text.findOne({ title })
                        .populate({ path: 'owner', model: User, select: 'email'})
                        .populate({ path: 'language', model: Language, select: 'name'})
                        .exec();
  
    res.json({
      ok: true,
      text
    });
  } catch (e) {
    console.log(e);
  }
});

router.get('/keyboard', async (req, res) => {
  try {
    const language = await Language.findOne({ name: req.query.lang });
    const layout = await Keyboard.findOne({ language });
    res.json({
      ok: true,
      layout
    });

  } catch (e) {
    console.log(e);
  }
});

module.exports = router;