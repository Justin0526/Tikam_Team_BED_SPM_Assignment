// middlewares/registration_validation.js
const Joi = require('joi');

// REGISTRATION VALIDATION MIDDLEWARE
const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    fullName: Joi.string().min(3).required().messages({
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least 3 characters'
    }),
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.empty': 'Username is required',
      'string.alphanum': 'Username must only contain letters and numbers',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username must be at most 30 characters'
    }),
    email: Joi.string().email().required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be a valid email address'
    }),
    password: Joi.string()
      .min(6)
      .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).*$/)
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters',
        'string.pattern.base': 'Password must contain at least 1 uppercase letter and 1 special character'
      }),
    confirmPassword: Joi.valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match',
      'string.empty': 'Please confirm your password'
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next(); // Proceed to controller
};

module.exports = { validateRegistration };
