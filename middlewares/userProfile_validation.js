const Joi = require('joi');

const profileSchema = Joi.object({
  userID: Joi.number().integer().required(),
  fullName: Joi.string().max(100).required().messages({
    'string.empty': 'Full name is required.',
    'string.max': 'Full name must not exceed 100 characters.'
  }),
  dob: Joi.date().iso().max('now').optional().allow('', null).messages({
    'date.max': 'Date of birth cannot be in the future.'
  }),
  gender: Joi.string().valid('Male', 'Female', 'Prefer not to say').optional().allow('', null),
  allergies: Joi.string().max(255).allow('', null),
  conditions: Joi.string().max(255).allow('', null),
  emergencyName: Joi.string().max(100).allow('', null),
  emergencyNumber: Joi.string().pattern(/^[0-9\-+ ]*$/).max(20).allow('', null),
  address: Joi.string().max(255).allow('', null),
  bio: Joi.string().max(500).allow('', null),
  profilePicture: Joi.string().uri().allow('', null)  
});

const validateProfile = (req, res, next) => {
  const { error } = profileSchema.validate(req.body, { abortEarly: false });

  if (error) {
    console.error("❌ Joi Validation Errors:", error.details.map(e => e.message));
    const details = error.details.map(detail => detail.message);
    return res.status(400).json({ errors: details });
  }

  next();
};

module.exports = validateProfile;