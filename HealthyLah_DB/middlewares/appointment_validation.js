const Joi = require("joi");

const appointmentSchema = Joi.object({
    doctorName: Joi.string().min(1).max(100).required().messages({
        "string.base": "Doctor name must be a string",
        "string.empty": "Doctor name cannot be empty",
        "string.max": "Doctor name cannot exceed 100 characters",
        "any.required": "Doctor name is required"
    }),
    clinicName: Joi.string().min(1).max(100).required().messages({
        "string.base": "Clinic Name must be a string",
        "string.empty": "Clinic name cannot be empty",
        "string.max": "Clinic name cannot exceed 100 characters",
        "any.required": "Clinic name is required"
    }),
    appointmentDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        "string.empty": "Appointment date is required",
        "string.pattern.base": "Appointment date must be in YYYY-MM-DD format"
    }),
    appointmentTime: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required().messages({
        "string.empty": "Appointment time is required",
        "string.pattern.base": "Appointment time must be in HH:MM or HH:MM:SS format"
    }),
    purpose: Joi.string().min(1).max(255).required().messages({
        "string.empty": "Purpose is required",
        "string.max": "Purpose cannot exceed 255 characters"
    }),
    reminderDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
        "string.pattern.base": "Reminder date must be in YYYY-MM-DD format"
    })
});

// Middleware to validate req.body
function validateAppointment(req, res, next) {
    const { error } = appointmentSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map(d => d.message).join(", ");
        return res.status(400).json({ error: errorMessage });
    }
    next();
}

// //After verifyJWT(authorization) and token includes appointmentID, validation for req.params might not be needed anymore!!
// // Middleware to validate appointmentID (or userID) in req.params
// function validateAppointmentId(req, res, next) {
//     const userID = parseInt(req.params.userID);
//     if (isNaN(userID) || userID <= 0) {
//         return res.status(400).json({ error: "Invalid ID. Must be a positive number." });
//     }
//     next();
// }

module.exports = {
    validateAppointment
};
