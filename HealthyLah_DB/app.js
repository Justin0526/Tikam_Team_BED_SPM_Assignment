const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config()

// ─── Controllers ────────────────────────────────────────────────────────────────
const userController = require("./controllers/user_controller");
const weatherController = require("./controllers/weather_controller");
const favouriteOutfitController = require("./controllers/favouriteOutfit_controller");
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
app.post("/login", userController.loginUser );

// Weather routes
app.get( "/weather",  weatherController.getWeather );
app.post("/weather", verifyJWT, weatherController.createFavouriteOutfit);

// Favourite outfit routes
app.get("/favouriteOutfit",verifyJWT, favouriteOutfitController.getFavouriteOutfit)
app.delete("/favouriteOutfit/:favouriteOutfitID", verifyJWT, favouriteOutfitController.deleteFavouriteOutfit)

// Appointment route
app.get("/appointments/me", verifyJWT, appointmentController.getAppointmentsByUserID);
app.post("/appointments", verifyJWT, appointmentValidator.validateAppointment, appointmentController.createAppointment);
app.put("/appointments/:appointmentID", verifyJWT, appointmentValidator.validateAppointment, appointmentController.updateAppointmentByAppointmentID);

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

// Translation
app.post("/translate", translateText );

app.listen(3000, () => {
  console.log('Server is running on port 3000');
}).on('error', (err) => {
  console.error('Server failed to start:', err.message);
});


process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connection closed");
  process.exit(0);
});

