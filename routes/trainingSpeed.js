const express = require('express');
const router = express.Router();

router.get('/prepare', async (req, res) => {
  console.log('prepareGet');
  await setTimeout(() => res.json({ ok: true }), 5000);
});


router.get('/text', async (req, res) => {
  console.log(req.query);
});


module.exports = router;