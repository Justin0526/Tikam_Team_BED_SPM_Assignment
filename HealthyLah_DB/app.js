// app.js
require("dotenv").config();

const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const path = require("path");

// ─── Load your DB config ────────────────────────────────────────────────────────
const dbConfig = require("./dbConfig");

// ─── Controllers ────────────────────────────────────────────────────────────────
const userController = require("./controllers/user_controller");
const weatherController = require("./controllers/weather_controller");
const appointmentController = require("./controllers/appointment_controller");
const medicationsController = require("./controllers/medications_controller");
const { translateText } = require("./controllers/translation_controller");
const postsController = require("./controllers/posts_controller");

// ─── Validation Middleware ──────────────────────────────────────────────────────
const appointmentValidator = require("./middlewares/appointment_validation");
const medicationValidator  = require("./middlewares/medication_validation");
const { validatePost, validatePostId } = require("./middlewares/posts_validation");
const { verify } = require("crypto");
const {verifyJWT} = require("./middlewares/authMiddleware");

// ─── Create Express App ─────────────────────────────────────────────────────────
const app  = express();
const port = process.env.PORT || 3000;

// ─── Global Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files ────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ─── Routes ─────────────────────────────────────────────────────────────────────
// User routes
app.get( "/users", userController.getAllUsers );
app.post("/register", userController.registerUser );
app.post("/users/login", userController.loginUser );

// Weather & translation
app.get( "/weather",  weatherController.getWeather );
app.post("/translate", translateText );

// Appointment route
app.get("/appointments", appointmentController.getAllAppointments);
app.get("/appointments/me", verifyJWT, appointmentController.getAppointmentsByUserID);
app.post("/appointments", verifyJWT, appointmentValidator.validateAppointment, appointmentController.createAppointment);

// Medication routes
app.get("/medications/today", medicationsController.getTodayMeds );
app.post("/medications", medicationValidator, medicationsController.addMedication );
app.patch("/medications/:medicationID/mark-taken", medicationsController.markTaken );

// Posts CRUD
app.get("/posts", postsController.getAllPosts );
app.get("/posts/:id",
  validatePostId,
  postsController.getPostById
);
app.post( "/posts",
  validatePost,
  postsController.createPost
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connection closed");
  process.exit(0);
});

