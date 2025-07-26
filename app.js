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
const { getUserHealthProfile } = require('./controllers/health_controller');
const medicationsController = require("./controllers/medications_controller");
const editMedicationsController = require('./controllers/edit_medication_controller');
const { translateText } = require("./controllers/translation_controller");
const postsController = require("./controllers/posts_controller");
const browseFacilityController = require('./controllers/browse_facility_controller');
const transportAndFacilitiesController = require("./controllers/transport_and_facilities_controller");
const viewBusController = require("./controllers/view_bus_controller");
const profileController = require('./controllers/userProfile_controller');
const { uploadImage } = require('./controllers/upload_controller')
const mealController = require('./controllers/meal_controller');
const healthRecordsController = require("./controllers/healthRecords_controller");


// ─── Validation Middleware ──────────────────────────────────────────────────────
const appointmentValidator = require("./middlewares/appointment_validation");
const medicationValidator  = require("./middlewares/medication_validation");
const { validatePost, validatePostId } = require("./middlewares/posts_validation");
const { verify } = require("crypto");
const {verifyJWT} = require("./middlewares/authMiddleware");
const validateUserProfile = require('./middlewares/userProfile_validation');
const { validateRegistration } = require('./middlewares/registration_validation');
const { validateLogin } = require('./middlewares/login_validation');
const mealValidator =require("./middlewares/meal_validation");

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

// Transport and Facilities routes
app.post("/nearbyFacilities", transportAndFacilitiesController.getFacilities);
app.post("/nearbyPublicTransport", transportAndFacilitiesController.getpublicTransport);

// Browse Facilities routes
app.post('/facilities', browseFacilityController.getFacilities);
app.get('/facilities/photo', browseFacilityController.getPhoto);

// View Bus routes
app.get("/busStops", viewBusController.getBusStops);
app.get("/busArrival", viewBusController.getBusArrival);

// Appointment route
app.get("/appointments/me", verifyJWT, appointmentController.getAppointmentsByUserID);
app.post("/appointments", verifyJWT, appointmentValidator.validateAppointment, appointmentController.createAppointment);
app.put("/appointments/:appointmentID", verifyJWT, appointmentValidator.validateAppointment, appointmentValidator.validateAppointmentId, appointmentController.updateAppointmentByAppointmentID);
app.delete("/appointments/:appointmentID", verifyJWT, appointmentValidator.validateAppointmentId, appointmentController.deleteAppointment);
app.get("/appointments/search", verifyJWT, appointmentValidator.validateSearchQuery, appointmentController.searchAppointments);

// Meal routes
app.get("/meals/me", verifyJWT, mealController.getMealsByUserIDAndMealDate);
app.post("/meals", verifyJWT, mealValidator.validateMeal, mealController.createMealLog);
app.put("/meals/:mealID", verifyJWT, mealValidator.validateMeal, mealValidator.validateMealId, mealController.updateMealLogByMealID);
app.delete("/meals/:mealID", verifyJWT, mealValidator.validateMealId, mealController.deleteMealLogByMealID);

// Health page route
app.get('/api/health-profile', verifyJWT, getUserHealthProfile);

// Medication routes
app.get("/medications/today", verifyJWT, medicationsController.getTodayMeds );
app.post("/medications", verifyJWT, medicationValidator, medicationsController.addMedication );
app.put("/medications/:medicationID/mark-taken", verifyJWT, medicationsController.markTaken );
app.get("/medications/upcoming", verifyJWT, medicationsController.getUpcomingMeds);

// Edit medication routes
app.get("/medications/:medicationID", editMedicationsController.getMedicationById);
app.put("/medications/:medicationID", editMedicationsController.updateMedication);
app.delete("/medications/:medicationID", editMedicationsController.deleteMedication);

// Posts CRUD
app.get("/posts", postsController.getAllPosts);
app.get("/posts/:id", verifyJWT, validatePostId, postsController.getPostById);
app.post( "/posts", verifyJWT, validatePost, postsController.createPost);
app.post("/api/upload", uploadImage);
app.delete("/posts/:id", verifyJWT, postsController.deletePost)
app.put("/posts/:id", verifyJWT, postsController.updatePost)

// Comments CRUD
app.get( "/posts/:postID/comments", verifyJWT, postsController.getCommentsForPost);
app.post("/posts/:postID/comments", verifyJWT, postsController.createCommentForPost);  
app.put("/posts/:postID/comments/:commentID", verifyJWT, postsController.updateComment);
app.delete("/posts/:postID/comments/:commentID", verifyJWT, postsController.deleteComment);

// Translation
app.post("/translate", translateText );

//node start
app.listen(3000, () => {
  console.log('Server is running on port 3000');
}).on('error', (err) => {
  console.error('Server failed to start:', err.message);
});

// Profile-related routes
app.get('/api/profile/:userID', verifyJWT, profileController.getProfile);
app.post('/api/profile/update', verifyJWT, validateUserProfile, profileController.updateProfile);

// Health Records routes
app.get("/api/healthRecords/:userID", healthRecordsController.getHealthRecords); // Read
app.post("/api/healthRecords", healthRecordsController.addRecord);               // Create
app.put("/api/healthRecords/:recordID", healthRecordsController.updateRecord);   // Update
app.delete("/api/healthRecords/:recordID", healthRecordsController.deleteRecord); // Delete

// Reset medication route
require('./models/reset_medication_status');

process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connection closed");
  process.exit(0);
});

