const Joi = require("joi");
const express = require("express");

// Middleware to enable JSON and URL-encoded request body parsing in Express
module.exports = function(app) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};

// Joi schema for validating post data
const postSchema = Joi.object({
  //validate UserID to make sure its a positive integer and its required
  UserID: Joi.number().integer().positive().required()
    .messages({
      "number.base":    "UserID must be a number",
      "number.integer": "UserID must be an integer",
      "number.positive":"UserID must be positive",
      "any.required":   "UserID is required"
    }),
  //validate content must be a string between 1–500 chars, required
  Content: Joi.string().min(1).max(500).required()
    .messages({
      "string.base":   "Content must be a string",
      "string.empty":  "Content cannot be empty",
      "string.min":    "Content must be at least 1 character",
      "string.max":    "Content cannot exceed 500 characters",
      "any.required":  "Content is required"
    }),
  //validate imageURL must be a valid URL if provided, or can be empty/null
  ImageURL: Joi.string().uri().optional().allow(null, "")
    .messages({ "string.uri": "ImageURL must be a valid URL" })
});

//Middleware to validate a post's request body using Joi schema.
//Returns HTTP 400 (Bad Request) if validation fails, otherwise continues.
function validatePost(req, res, next) {
  const { error } = postSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const msg = error.details.map(d => d.message).join(", ");
    return res.status(400).json({ error: msg });
  }
  next();
}

//Middleware to validate PostID (from URL parameter).
//Ensures PostID is a positive integer.
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
