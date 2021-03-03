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


router.get('/selectedTextData', async (req, res) => {
  try{
    const data = await Text.findOne({ title: req.query.textTitle});
    const text = data.text.substr(0, +req.query.length).replace(/\s+/g, ' '); // сделать эту регулярку при загрузке текста
    const textLang = await Language.findById(data.language);
    const keyboardLayout = await Keyboard.findOne({ language: data.language });
  
    res.json({text, textTitle: data.title, textLang: textLang.name, keyboardLayout: keyboardLayout.layout });
  } catch (e) {
    res.json({error: "Something goes wrong"});
  }
});


router.get('/prepare', async (req, res) => {
  await setTimeout(() => res.json({ ok: true }), 5000);
});



module.exports = router;