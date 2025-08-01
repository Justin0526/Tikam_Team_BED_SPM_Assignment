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
     // Clean up empty string fields before validation
    Object.keys(req.body).forEach(key => {
        if (req.body[key] === "") {
            delete req.body[key];
        }
    });

    const { error } = appointmentSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map(d => d.message).join(", ");
        return res.status(400).json({ error: errorMessage });
    }


    const {appointmentDate, appointmentTime, reminderDate} = req.body;
    
    //Combine date and time into a single Date object
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();

    if(appointmentDateTime < now) {
        return res.status(400).json({
            error: "Appointment date and time cannot be in the past."
        });
    }

    //Check if reminderDate is in the past
    if(reminderDate) {
        const reminderDateOnly = new Date(reminderDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Ignore time

        if(reminderDateOnly < today){
            return res.status(400).json({
                error: "Reminder date cannot be in the past."
            });
        }
        
    }
    
    //Ensure reminderDate is not after appointmentDate
    if(reminderDate){
        const appointment = new Date(appointmentDate);
        const reminder = new Date(reminderDate);

        if(reminder > appointment){
            return res.status(400).json({
                error: "Reminder date cannot be later than the appointment date."
            });
        }
    }
    next();
}

// Middleware to validate appointmentID in req.params
function validateAppointmentId(req, res, next) {
    const appointmentID = parseInt(req.params.appointmentID);
    if (isNaN(appointmentID) || appointmentID <= 0) {
        return res.status(400).json({ error: "Invalid ID. Must be a positive number." });
    }
    next();
}

function validateSearchQuery(req, res, next) {
    const searchTerm = req.query.searchTerm || "";
    const appointmentDate = req.query.appointmentDate || null;

    if(!searchTerm && !appointmentDate) {
        return res.status(400).json({ message: "Please provide any keywords or appointment date to search." });
    }

    //check if appointmenDate is in YYYY-MM-DD format
    if(appointmentDate && !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
        return res.status(400).json({ error: "Appointment date must be in YYYY-MM-DD format." });
    }
    next();
}

module.exports = {
    validateAppointment,
    validateAppointmentId,
    validateSearchQuery,
};
