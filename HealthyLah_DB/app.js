const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Controllers
const weatherController = require("./controllers/weather_controller");
const appointmentController = require("./controllers/appointment_controller");
const medicationsController = require('./controllers/medications_controller');
const { translateText } = require("./controllers/translation_controller");

// Middlewares
const appointmentValidator = require("./middlewares/appointment_validation");
const medicationValidator = require("./middlewares/medication_validation");

// Routes
app.get("/weather", weatherController.getWeather);

app.get("/appointments", appointmentController.getAllAppointments);
app.get("/appointments/user/:userID", appointmentValidator.validateAppointmentId, appointmentController.getAppointmentsByUserID);
app.post("/appointments/user", appointmentValidator.validateAppointment, appointmentController.createAppointment);

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
