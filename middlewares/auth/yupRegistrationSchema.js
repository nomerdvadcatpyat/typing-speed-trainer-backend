const yup = require('yup');

module.exports = registrationSchema = yup.object().shape({
	login: yup.string().min(2).max(25).required('wrong login'),
	password: yup.string().min(3).max(25).required('Password is required'),
	rePassword: yup.string().min(3).max(25)
		.oneOf([yup.ref('password'), null], 'Passwords must match')
});