const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

dotenv.config();   // Load env first

const app = express();   // Initialize app first

app.use(cors());    // Now use cors

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const weatherController = require("./controllers/weather_controller");
const appointmentController = require("./controllers/appointment_controller");

//Middlewares
const appointmentValidator = require("./middlewares/appointment_validation");

// Serve static files from 'public'
app.use(express.static(path.join(__dirname, "public")));

// Weather route
app.get("/weather", weatherController.getWeather);

//Route for appointments
app.get("/appointments", appointmentController.getAllAppointments);
app.get("/appointments/user/:userID", appointmentValidator.validateAppointmentId, appointmentController.getAppointmentsByUserID);
app.post("/appointments/user", appointmentValidator.validateAppointment, appointmentController.createAppointment);

const { translateText } = require("./controllers/translation_controller");

app.post("/translate", translateText);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connection closed");
  process.exit(0);
});
