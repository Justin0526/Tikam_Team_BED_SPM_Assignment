const Joi = require('joi');

/**
 * Joi validation schema for medication input.
 */
const medicationSchema = Joi.object({
  medicineName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.base': 'Medicine name must be a string.',
      'string.empty': 'Medicine name is required.',
      'any.required': 'Medicine name is required.'
    }),

  dosage: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.base': 'Dosage must be a string.',
      'string.empty': 'Dosage is required.',
      'any.required': 'Dosage is required.'
    }),

  frequency: Joi.string()
    .valid('Daily', 'Weekly', 'As Needed')
    .required()
    .messages({
      'any.only': 'Frequency must be Daily, Weekly, or As Needed.',
      'any.required': 'Frequency is required.'
    }),

  consumptionTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .required()
    .messages({
      'string.pattern.base': 'Consumption time must be in HH:mm or HH:mm:ss format.',
      'any.required': 'Consumption time is required.'
    }),

  startDate: Joi.date()
  .iso()
  .custom((value, helpers) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize to midnight
    const selected = new Date(value);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      return helpers.message('Start date cannot be in the past.');
    }
    return value;
  })
  .required(),

  endDate: Joi.date()
    .iso()
    .greater(Joi.ref('startDate')) // End date must be after start date
    .allow(null, '')
    .messages({
      'date.base': 'End date must be a valid date.',
      'date.greater': 'End date must be after the start date.'
    }),


  userID: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'User ID must be a number.',
      'number.integer': 'User ID must be an integer.',
      'number.positive': 'User ID must be positive.',
      'any.required': 'User ID is required.'
    }),

  notes: Joi.string().allow('').optional()
});

/**
 * Middleware for validating medication creation/editing requests using Joi.
 */
function validateMedication(req, res, next) {
  req.body.userID = req.user.userID; // Set userID from JWT token
  const { error } = medicationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });

  if (error) {
    const errorMessages = error.details.map(d => d.message);
    return res.status(400).json({ errors: errorMessages });
  }

  next();
}

module.exports = validateMedication;