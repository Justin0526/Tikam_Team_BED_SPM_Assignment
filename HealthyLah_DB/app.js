const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

dotenv.config();

// Controllers
const userController = require("./controllers/user_controller");
const weatherController = require("./controllers/weather_controller");
const appointmentController = require("./controllers/appointment_controller");
const medicationsController = require('./controllers/medications_controller');
const { translateText } = require("./controllers/translation_controller");

// Create express app
const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
const appointmentValidator = require("./middlewares/appointment_validation");
const medicationValidator = require("./middlewares/medication_validation");
const { verifyJWT } = require("./middlewares/authMiddleware");

// Routes
// User Route
app.get("/users", userController.getAllUsers);
app.post("/users", userController.registerUser);
app.post("/users/login", userController.loginUser);

// Weather Route
app.get("/weather", weatherController.getWeather);

// Appointment route
app.get("/appointments", appointmentController.getAllAppointments);
// app.get("/appointments/user/:userID", appointmentValidator.validateAppointmentId, appointmentController.getAppointmentsByUserID);
// app.post("/appointments/user", appointmentValidator.validateAppointment, appointmentController.createAppointment);
app.get("/appointments/me", verifyJWT, appointmentController.getAppointmentsByUserID);
app.post("/appointments", verifyJWT, appointmentValidator.validateAppointment, appointmentController.createAppointment);

// Medication Route
app.get("/medications/today", medicationsController.getTodayMeds);
app.post("/medications", medicationValidator, medicationsController.addMedication);
app.patch("/medications/:medicationID/mark-taken", medicationsController.markTaken);

app.post("/translate", translateText);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connection closed");
  process.exit(0);
});
