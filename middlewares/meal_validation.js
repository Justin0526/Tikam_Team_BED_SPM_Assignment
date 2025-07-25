const Joi = require("joi");

// const mealSchema = Joi.object({
//     foodItem: Joi.string().min(1).max(100).required().messages({
//         "string.base": "Food name must be a string",
//         "string.empty": "Food name cannot be empty",
//         "string.max": "Food name cannot exceed 100 characters",
//         "any.required": "Food name is required"
//     }),
//     timeFrame: Joi.string().min(1).max(100).required().messages({
//         "string.base": "Time frame must be a string",
//         "string.empty": "Time frame cannot be empty",
//         "string.max": "Time frame cannot exceed 100 characters",
//         "any.required": "Time frame is required"
//     }),
//     mealDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
//         "string.empty": "Log date is required",
//         "string.pattern.base": "Log date must be in YYYY-MM-DD format"
//     })
// });

const mealSchema = Joi.object({
    foodItem: Joi.string().min(1).max(100).required().messages({
        "string.base": "Food name must be a string",
        "string.empty": "Food name cannot be empty",
        "string.max": "Food name cannot exceed 100 characters",
        "any.required": "Food name is required"
    }),
    timeFrame: Joi.string().min(1).max(100).required().messages({
        "string.base": "Time frame must be a string",
        "string.empty": "Time frame cannot be empty",
        "string.max": "Time frame cannot exceed 100 characters",
        "any.required": "Time frame is required"
    }),
    mealDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        "string.empty": "Log date is required",
        "string.pattern.base": "Log date must be in YYYY-MM-DD format"
    }),
    manualCalories: Joi.alternatives().try(
        Joi.string().valid("unknown"),
        Joi.string().pattern(/^\d+$/), // allows numeric string like "100"
        Joi.allow(null)
    ).optional().messages({
        "any.only": "Manual calories must be a number or 'unknown'",
        "string.pattern.base": "Manual calories must be digits only or 'unknown'"
    })
});


// Middleware to validate req.body
function validateMeal(req, res, next) {
    const { error } = mealSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map(d => d.message).join(", ");
        return res.status(400).json({ error: errorMessage });
    }

    //check if mealDate is in the future
    const mealDate = new Date(req.body.mealDate);
    mealDate.setHours(0, 0, 0, 0);//Strip time from input

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Strip time from today

    
    if (mealDate > today) {
        return res.status(400).json({
            error: "Meal date cannot be in the future."
        });
    }
    next();
}

// Middleware to validate mealID in req.params
function validateMealId(req, res, next) {
    const mealID = parseInt(req.params.mealID);
    if (isNaN(mealID) || mealID <= 0) {
        return res.status(400).json({ error: "Invalid ID. Must be a positive number." });
    }
    next();
}

// function validateSearchQuery(req, res, next) {
//     const searchTerm = req.query.searchTerm || "";
//     const appointmentDate = req.query.appointmentDate || null;

//     if(!searchTerm && !appointmentDate) {
//         return res.status(400).json({ message: "Please provide any keywords or appointment date to search." });
//     }

//     //check if appointmenDate is in YYYY-MM-DD format
//     if(appointmentDate && !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
//         return res.status(400).json({ error: "Appointment date must be in YYYY-MM-DD format." });
//     }
//     next();
// }

module.exports = {
    validateMeal,
    validateMealId,
    // validateSearchQuery,
};
