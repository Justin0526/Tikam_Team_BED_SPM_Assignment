const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");


dotenv.config();

const weatherController = require("./controllers/weather_controller");
const appointmentController = require("./controllers/appointment_controller");

//Middlewares
const appointmentValidator = require("./middlewares/appointment_validation");

const app = express();
const port = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public'
app.use(express.static(path.join(__dirname, "public")));

// Weather route
app.get("/weather", weatherController.getWeather);

//Route for appointments
app.get("/appointments", appointmentController.getAllAppointments);
app.get("/appointments/user/:userID", appointmentValidator.validateAppointmentId, appointmentController.getAppointmentsByUserID);
app.post("/appointments/user", appointmentValidator.validateAppointment, appointmentController.createAppointment);

//Temporary
// app.get("/test", (req, res) => {
//   console.log("✅ POST /test was hit");
//   res.json({ message: "Test route working!" });
// });

const { translateText } = require("./controllers/translation_controller");
app.use(express.json());

app.post("/translate", translateText);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connection closed");
  process.exit(0);
});

