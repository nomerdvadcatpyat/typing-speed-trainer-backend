const yupRegistrationSchema = require('./yupRegistrationSchema');

module.exports = async function validateRegistration(req, res, next) {
  try {
    const user = req.body;
    await yupRegistrationSchema.validate(user);
    
    return next();
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: e.errors.join(', ') });
  }
}
