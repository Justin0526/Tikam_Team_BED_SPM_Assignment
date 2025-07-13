const Joi = require('joi');

const profileSchema = Joi.object({
  userID: Joi.number().integer().required(),

  fullName: Joi.string().max(100).required().messages({
    'string.empty': 'Full name is required.',
    'string.max': 'Full name must not exceed 100 characters.'
  }),

  dob: Joi.date().iso().required().messages({
    'date.base': 'Date of birth must be a valid date.',
    'any.required': 'Date of birth is required.'
  }),

  gender: Joi.string().valid('Male', 'Female', 'Prefer not to say').required().messages({
    'any.only': 'Gender must be Male, Female, or Prefer not to say.'
  }),

  allergies: Joi.string().max(100).allow('', null),

  conditions: Joi.string().max(100).allow('', null),

  emergencyName: Joi.string().max(100).allow('', null),

  emergencyNumber: Joi.string().pattern(/^[0-9\-+ ]*$/).max(20).allow('', null).messages({
    'string.pattern.base': 'Emergency number can only contain numbers, spaces, +, or -.'
  }),

  address: Joi.string().max(255).allow('', null),

  bio: Joi.string().max(500).allow('', null)
});

const validateProfile = (req, res, next) => {
  const { error } = profileSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const details = error.details.map(detail => detail.message);
    return res.status(400).json({ errors: details });
  }

  next();
};

module.exports = validateProfile;
