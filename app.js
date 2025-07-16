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
const profileController = require('./controllers/profileController');
const { uploadImage } = require('./controllers/upload_controller')

// ─── Validation Middleware ──────────────────────────────────────────────────────
const appointmentValidator = require("./middlewares/appointment_validation");
const medicationValidator  = require("./middlewares/medication_validation");
const { validatePost, validatePostId } = require("./middlewares/posts_validation");
const { verify } = require("crypto");
const {verifyJWT} = require("./middlewares/authMiddleware");
const {validateUserProfile} = require('./middlewares/userProfile_validation');
const { validateRegistration } = require('./middlewares/registration_validation');
const { validateLogin } = require('./middlewares/login_validation');


// ─── Create Express App ─────────────────────────────────────────────────────────
const app  = express();
const port = process.env.PORT || 3000;

// ─── Global Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({limit : "10mb"}));
app.use(express.urlencoded({ extended: true }));

// ─── Static Files ────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ─── Routes ─────────────────────────────────────────────────────────────────────
// User routes
app.get( "/users", userController.getAllUsers );
app.post("/register", validateRegistration, userController.registerUser );
app.post("/login", validateLogin, userController.loginUser );

// Weather routes
app.get( "/weather",  weatherController.getWeather );
app.post("/weather", verifyJWT, weatherController.createFavouriteOutfit);

// Favourite outfit routes
app.get("/favouriteOutfit",verifyJWT, favouriteOutfitController.getFavouriteOutfit)
app.delete("/favouriteOutfit/:favouriteOutfitID", verifyJWT, favouriteOutfitController.deleteFavouriteOutfit)

// Appointment route
app.get("/appointments/me", verifyJWT, appointmentController.getAppointmentsByUserID);
app.post("/appointments", verifyJWT, appointmentValidator.validateAppointment, appointmentController.createAppointment);
app.put("/appointments/:appointmentID", verifyJWT, appointmentValidator.validateAppointment, appointmentValidator.validateAppointmentId, appointmentController.updateAppointmentByAppointmentID);

// Medication routes
app.get("/medications/today", medicationsController.getTodayMeds );
app.post("/medications", medicationValidator, medicationsController.addMedication );
app.put("/medications/:medicationID/mark-taken", medicationsController.markTaken );

// Posts CRUD
app.get("/posts", postsController.getAllPosts );
app.get("/posts/:id",
  verifyJWT,
  validatePostId,
  postsController.getPostById
);
app.post( "/posts",
  verifyJWT,
  validatePost,
  postsController.createPost
);
app.post("/api/upload", uploadImage);

// Translation
app.post("/translate", translateText );

app.listen(3000, () => {
  console.log('Server is running on port 3000');
}).on('error', (err) => {
  console.error('Server failed to start:', err.message);
});

// Profile-related routes
app.get('/api/profile/:userID', profileController.getProfile);
app.post('/api/profile/update', validateUserProfile, profileController.updateProfile);

// Reset medication route
require('./models/reset_medication_status');

process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connection closed");
  process.exit(0);
});

