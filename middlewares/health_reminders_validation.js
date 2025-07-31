// middlewares/reminder_validation.js
const Joi = require("joi");

// Joi schema for reminder validation
const reminderSchema = Joi.object({
  title: Joi.string().max(100).required().messages({
    "string.empty": "Title is required",
    "string.max": "Title must be less than or equal to 100 characters"
  }),
  reminderTime: Joi.string()
    .pattern(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/) // HH:MM:SS format
    .required()
    .messages({
      "string.empty": "Reminder time is required",
      "string.pattern.base": "Reminder time must be in HH:MM:SS format"
    }),
  frequency: Joi.string().max(50).required().messages({
    "string.empty": "Frequency is required",
    "string.max": "Frequency must be less than or equal to 50 characters"
  }),
  message: Joi.string().max(255).allow(null, "").messages({
    "string.max": "Message must be less than or equal to 255 characters"
  }),
  startDate: Joi.date().required().messages({
    "date.base": "Start date must be a valid date",
    "any.required": "Start date is required"
  }),
  endDate: Joi.date().min(Joi.ref("startDate")).allow(null).messages({
    "date.min": "End date cannot be earlier than start date"
  })
});

// Middleware
function validateReminder(req, res, next) {
  const { error } = reminderSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      errors: error.details.map((err) => err.message)
    });
  }
  next();
}

module.exports = validateReminder;