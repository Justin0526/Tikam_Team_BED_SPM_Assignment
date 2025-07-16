// middlewares/userProfile_validation.js
const Joi = require('joi');

const validateUserProfile = (req, res, next) => {
  const schema = Joi.object({
    userID: Joi.number().integer().positive().required(),

    fullName: Joi.string().min(3).max(100).required().messages({
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least 3 characters'
    }),

    dob: Joi.date().less('now').required().messages({
      'date.base': 'Invalid date format for DOB',
      'date.less': 'Date of birth must be in the past'
    }),

    gender: Joi.string().valid('Male', 'Female', 'Prefer not to say').required()
      .messages({
        'any.only': 'Gender must be Male, Female or Prefer not to say',
        'string.empty': 'Gender is required'
      }),

    allergies: Joi.string().max(100).allow('').messages({
      'string.max': 'Allergies must not exceed 100 characters'
    }),

    conditions: Joi.string().max(100).allow('').messages({
      'string.max': 'Conditions must not exceed 100 characters'
    }),

    emergencyName: Joi.string().min(3).max(100).required().messages({
      'string.empty': 'Emergency contact name is required',
      'string.min': 'Emergency contact name must be at least 3 characters'
    }),

    emergencyNumber: Joi.string().pattern(/^[\d+\- ]{8,20}$/).required().messages({
      'string.pattern.base': 'Emergency number must be valid and 8–20 digits',
      'string.empty': 'Emergency number is required'
    }),

    address: Joi.string().max(255).allow('').messages({
      'string.max': 'Address must not exceed 255 characters'
    }),

    bio: Joi.string().max(500).allow('').messages({
      'string.max': 'Bio must not exceed 500 characters'
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};

module.exports = { validateUserProfile };
