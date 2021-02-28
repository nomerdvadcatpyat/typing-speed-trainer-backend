const express = require('express');
const Text = require('../models/text');
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



module.exports = router;