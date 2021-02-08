

module.exports = function validateRegistration(req, res, next) {
  const errors = [];
  const { email, password, rePassword } = req.body;

  if(!email || !password || !rePassword) {
    const fields = [];
    if(!email) fields.push('email');
    if(!password) fields.push('password');
    if(!rePassword) fields.push('rePassword');

    errors.push({fields, message: 'Все поля должны быть заполнены'});
  }
  else {
    if(!validateEmail(email)) {
      errors.push({ fields: ['email'], message: 'Введите корректный email'});
    }

    if(password.length < 3 || password.length > 50) {
      errors.push({ fields: ['password'], message: 'Длина пароля должна быть от 3 до 50 символов'});
    }

    if(password !== rePassword) {
      errors.push({ fields: ['password', 'rePassword'], message: 'Пароли не совпадают'});
    }
  } 

  if(errors.length > 0)
    req.errors = errors;

  return next();
}

function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}