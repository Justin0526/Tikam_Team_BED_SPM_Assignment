// Khaleel Anis S10270243D

// Import Joi for input validation
const Joi = require('joi');

/**
 * Joi validation schema for medication input.
 * This schema ensures that all medication-related data meets the required constraints:
 * - Validates medicine details like name, dosage, frequency, consumption time, and notes.
 * - Includes checks for date fields (startDate and endDate) to enforce proper logical ordering.
 * - Associates medication records with a valid user ID.
 */
const medicationSchema = Joi.object({
  // Medicine name: must be a non-empty string with a maximum length of 100 characters.
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

  // Dosage: must be a non-empty string with a maximum length of 50 characters.
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

  // Frequency: must be one of the predefined values ('Daily', 'Weekly', 'As Needed').
  frequency: Joi.string()
    .valid('Daily', 'Weekly', 'As Needed')
    .required()
    .messages({
      'any.only': 'Frequency must be Daily, Weekly, or As Needed.',
      'any.required': 'Frequency is required.'
    }),

  // Consumption time: must be in HH:mm or HH:mm:ss (24-hour) format.
  consumptionTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .required()
    .messages({
      'string.pattern.base': 'Consumption time must be in HH:mm or HH:mm:ss format.',
      'any.required': 'Consumption time is required.'
    }),

  // Start date: must be today or a future date.
  startDate: Joi.date()
    .iso()
    .custom((value, helpers) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize current date to midnight
      const selected = new Date(value);
      selected.setHours(0, 0, 0, 0);

      // Ensure the selected date is not in the past
      if (selected < today) {
        return helpers.message('Start date cannot be in the past.');
      }
      return value;
    })
    .required(),

  // End date: optional, but if provided must be after the start date.
  endDate: Joi.date()
    .iso()
    .greater(Joi.ref('startDate')) // Enforce end date > start date
    .allow(null, '')
    .messages({
      'date.base': 'End date must be a valid date.',
      'date.greater': 'End date must be after the start date.'
    }),

  // User ID: must be a positive integer (automatically derived from JWT).
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

  // Notes: optional field, allows an empty string if no notes are provided.
  notes: Joi.string().allow('').optional()
});

/**
 * Middleware for validating medication creation/editing requests using Joi.
 * - Attaches the authenticated user's ID (from JWT) to the request body.
 * - Validates input data against the schema.
 * - Returns a 400 Bad Request with detailed error messages if validation fails.
 * - Proceeds to the next middleware/handler if validation passes.
 */
function validateMedication(req, res, next) {
  // Automatically assign the userID from the authenticated user (JWT)
  req.body.userID = req.user.userID;

  // Validate request data, collect all errors (abortEarly: false) and remove unknown fields (stripUnknown: true)
  const { error } = medicationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });

  if (error) {
    // Map all Joi validation errors into readable messages
    const errorMessages = error.details.map(d => d.message);
    return res.status(400).json({ errors: errorMessages });
  }

  // Proceed to the next middleware or route handler if validation succeeds
  next();
}

// Export middleware for use in medication-related routes (e.g., add/edit medication)
module.exports = validateMedication;