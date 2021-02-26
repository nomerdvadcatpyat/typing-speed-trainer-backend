const express = require('express');
const Text = require('../models/text');
const Language = require('../models/language');
const User = require('../models/user');
const Keyboard = require('../models/keyboard');
const router = express.Router();

const lengths = ['10', '100', '250', '500'];

router.get('/selectTextPageData', async (req, res) => {
  const response = await Text.find();
  const textTitles = response.map(doc => doc.title);
  console.log(textTitles);

  res.json({
    textTitles,
    lengths
  });
});


router.get('/selectedTextData', async (req, res) => {
  const data = await Text.findOne({ title: req.query.textTitle});
  console.log('text', data.text.substr(0, +req.query.length));
  const text = data.text.substr(0, +req.query.length).replace(/\s+/g, ' '); // сделать эту регулярку при загрузке текста
  console.log('text', text);
  const keyboardLayout = await Keyboard.findOne({ language: data.language });

  res.json({text, textTitle: data.title, textLang: data.language, keyboardLayout: keyboardLayout.layout });
});


router.get('/prepare', async (req, res) => {
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