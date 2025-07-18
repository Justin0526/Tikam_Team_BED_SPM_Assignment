// middlewares/login_validation.js
const Joi = require('joi');

// LOGIN VALIDATION MIDDLEWARE
const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.empty': 'Username is required',
      'string.alphanum': 'Username must only contain letters and numbers',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username must be at most 30 characters'
    }),
    password: Joi.string().min(6).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters'
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next(); // Proceed to controller
};

module.exports = { validateLogin };
