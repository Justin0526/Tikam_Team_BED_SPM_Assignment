const Joi = require("joi");

const postSchema = Joi.object({
  UserID: Joi.number().integer().positive().required()
    .messages({
      "number.base":    "UserID must be a number",
      "number.integer": "UserID must be an integer",
      "number.positive":"UserID must be positive",
      "any.required":   "UserID is required"
    }),
  Content: Joi.string().min(1).max(500).required()
    .messages({
      "string.base":   "Content must be a string",
      "string.empty":  "Content cannot be empty",
      "string.min":    "Content must be at least 1 character",
      "string.max":    "Content cannot exceed 500 characters",
      "any.required":  "Content is required"
    }),
  ImageURL: Joi.string().uri().optional().allow(null, "")
    .messages({ "string.uri": "ImageURL must be a valid URL" })
});

function validatePost(req, res, next) {
  const { error } = postSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const msg = error.details.map(d => d.message).join(", ");
    return res.status(400).json({ error: msg });
  }
  next();
}

function validatePostId(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid PostID" });
  }
  next();
}

module.exports = {
  validatePost,
  validatePostId
};
