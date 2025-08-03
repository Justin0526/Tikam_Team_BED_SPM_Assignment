// Khaleel Anis S10270243D

// Import Joi for schema-based input validation
const Joi = require("joi");

/**
 * Joi schema for validating reminder data.
 * This schema ensures:
 * - Title: Required, string with a maximum length of 100 characters.
 * - Reminder Time: Required, must follow HH:MM:SS format.
 * - Frequency: Required, string with a maximum length of 50 characters.
 * - Message: Optional, string with a maximum length of 255 characters.
 * - Start Date: Required, cannot be in the past.
 * - End Date: Optional, but if provided, cannot be earlier than the start date.
 */
const reminderSchema = Joi.object({
  title: Joi.string().max(100).required().messages({
    "string.empty": "Title is required", // Triggered if title is empty
    "string.max": "Title must be less than or equal to 100 characters" // Triggered if title exceeds max length
  }),

  reminderTime: Joi.string()
    .pattern(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/) // Regex for HH:MM:SS format
    .required()
    .messages({
      "string.empty": "Reminder time is required", // Triggered if reminder time is missing
      "string.pattern.base": "Reminder time must be in HH:MM:SS format" // Triggered if time format is incorrect
    }),

  frequency: Joi.string().max(50).required().messages({
    "string.empty": "Frequency is required", // Triggered if frequency is missing
    "string.max": "Frequency must be less than or equal to 50 characters" // Triggered if frequency exceeds max length
  }),

  message: Joi.string().max(255).allow(null, "").messages({
    "string.max": "Message must be less than or equal to 255 characters" // Triggered if message exceeds max length
  }),

  // Validate that the start date is not in the past
  startDate: Joi.date().required().custom((value, helpers) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison
    const selected = new Date(value);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      return helpers.message("Start date cannot be in the past"); // Custom error message if start date is earlier than today
    }
    return value;
  }),

  // Validate that the end date is after the start date (if provided)
  endDate: Joi.date().allow(null).custom((value, helpers) => {
    if (!value) return value; // Skip validation if end date is null
    const start = new Date(helpers.state.ancestors[0].startDate); // Access startDate from the same request payload
    const end = new Date(value);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      return helpers.message("End date cannot be earlier than start date"); // Custom error message if invalid
    }
    return value;
  })
});

/**
 * Middleware function for validating reminder input.
 * - Validates incoming request data against the `reminderSchema`.
 * - If validation fails, responds with a 400 status and detailed error messages.
 * - If validation passes, moves to the next middleware or route handler.
 */
function validateReminder(req, res, next) {
  const { error } = reminderSchema.validate(req.body, { abortEarly: false }); 
  // `abortEarly: false` ensures all validation errors are collected, not just the first.

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      errors: error.details.map((err) => err.message) // Extract and return all error messages
    });
  }
  next(); // Proceed to the next middleware or route handler if validation passes
}

// Export the middleware for use in routes (e.g., POST/PUT reminder endpoints)
module.exports = validateReminder;