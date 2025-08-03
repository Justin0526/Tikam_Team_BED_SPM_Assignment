// ─── Imports ─────────────────────────────────────────────────────────────────────
const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");
// ─── Controllers ────────────────────────────────────────────────────────────────
// Group 1: User + Health + JWT
const userController = require("./controllers/user_controller");
const { getUserHealthProfile } = require('./controllers/health_controller');

// Group 2: Justin
const bookmarkController = require("./controllers/bookmark_controller");
const categoriesController = require("./controllers/category_controller");
const bookmarkCategoryController = require("./controllers/bookmark_category_controller");
const weatherController = require("./controllers/weather_controller");
const favouriteOutfitController = require("./controllers/favourite_outfit_controller");
const transportAndFacilitiesController = require("./controllers/transport_and_facilities_controller");
const browseFacilityController = require('./controllers/browse_facility_controller');
const viewBusController = require("./controllers/view_bus_controller");

// Group 3: Rey
const profileController = require('./controllers/userProfile_controller');
const healthRecordsController = require("./controllers/healthRecords_controller");

// Group 4: Shein
const appointmentController = require("./controllers/appointment_controller");
const mealController = require('./controllers/meal_controller');

// Group 5: Khaleel
const medicationsController = require("./controllers/medications_controller");
const editMedicationsController = require('./controllers/edit_medication_controller');
const healthRemindersController = require("./controllers/health_reminders_controller");
const editRemindersController = require("./controllers/edit_reminders_controller");

// Group 6: Wei Dai
const postsController = require("./controllers/posts_controller");
const { uploadImage } = require('./controllers/upload_controller');
const { translateText } = require("./controllers/translation_controller");

// ─── Middleware ─────────────────────────────────────────────────────────────────
// JWT + Auth
const { verifyJWT } = require("./middlewares/authMiddleware");

// Validation Middleware
const appointmentValidator = require("./middlewares/appointment_validation");
const medicationValidator = require("./middlewares/medication_validation");
const mealValidator = require("./middlewares/meal_validation");
const validateUserProfile = require('./middlewares/userProfile_validation');
const { validatePost, validatePostId } = require("./middlewares/posts_validation");
const { validateRegistration } = require('./middlewares/registration_validation');
const { validateLogin } = require('./middlewares/login_validation');

// ─── Create Express App ─────────────────────────────────────────────────────────
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// ─── Global Middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Static Files ───────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ─── Route Definitions ──────────────────────────────────────────────────────────

// ─── Group 1: User + Health + JWT ───
app.get("/users", userController.getAllUsers);
app.post("/register", validateRegistration, userController.registerUser);
app.post("/login", validateLogin, userController.loginUser);
app.get("/api/health-profile", verifyJWT, getUserHealthProfile);

// ─── Group 2: Justin ───
// Bookmarks
app.get("/bookmarks", verifyJWT, bookmarkController.getAllBookmarks);
app.get("/bookmark/:placeID", verifyJWT, bookmarkController.getBookmarkByPlaceID);
app.get("/search/bookmarks", verifyJWT, bookmarkController.searchBookmarks);
app.post("/bookmark", verifyJWT, bookmarkController.createBookmark);
app.delete("/bookmark", verifyJWT, bookmarkController.deleteBookmark);

// Categories
app.get("/categories", verifyJWT, categoriesController.getAllCategories);
app.post("/category", verifyJWT, categoriesController.createCategory);
app.put("/category", verifyJWT, categoriesController.updateCategoryName);
app.delete("/category", verifyJWT, categoriesController.deleteCategory);

// Bookmark-Category
app.get("/bookmark-category/category/:categoryID", verifyJWT, bookmarkCategoryController.getBookmarksByCategory);
app.get("/bookmark-category/bookmark/:bookmarkID", verifyJWT, bookmarkCategoryController.getCategoriesByBookmarkID);
app.post("/bookmark-category", verifyJWT, bookmarkCategoryController.assignBookmarkToCategory);
app.put("/bookmark-category", verifyJWT, bookmarkCategoryController.updateBookmarkCategory);
app.delete("/bookmark-category", verifyJWT, bookmarkCategoryController.deleteBookmarkFromCategory);
app.delete("/bookmarks/and/category", verifyJWT, bookmarkCategoryController.deleteBookmarksInCategory);

// Weather + Favourite Outfit
app.get("/weather", weatherController.getWeather);
app.post("/weather", verifyJWT, weatherController.createFavouriteOutfit);
app.get("/favouriteOutfit", verifyJWT, favouriteOutfitController.getFavouriteOutfit);
app.delete("/favouriteOutfit/:favouriteOutfitID", verifyJWT, favouriteOutfitController.deleteFavouriteOutfit);

// Transport + Facilities
app.post("/nearbyFacilities", transportAndFacilitiesController.getFacilities);
app.post("/nearbyPublicTransport", transportAndFacilitiesController.getpublicTransport);
app.post("/facilities", browseFacilityController.getFacilities);
app.get("/facilities/photo", browseFacilityController.getPhoto);
app.get("/facilities/:placeID", browseFacilityController.getFacilitiesByPlaceID);
app.get("/busStops", viewBusController.getBusStops);
app.get("/busArrival", viewBusController.getBusArrival);

// ─── Group 3: Rey ───
// Profile
app.get("/api/profile/:userID", verifyJWT, profileController.getProfile);
app.post("/api/profile/update", verifyJWT, validateUserProfile, profileController.updateProfile);
app.delete("/api/profile/:userID/remove-picture", verifyJWT, profileController.removeProfilePicture);

// Health Records
app.get("/api/healthRecords/:userID", healthRecordsController.getHealthRecords);
app.post("/api/healthRecords", healthRecordsController.addRecord);
app.put("/api/healthRecords/:recordID", healthRecordsController.updateRecord);
app.delete("/api/healthRecords/:recordID", healthRecordsController.deleteRecord);

// ─── Group 4: Shein ───
// Appointments
app.get("/appointments/me", verifyJWT, appointmentController.getAppointmentsByUserID);
app.post("/appointments", verifyJWT, appointmentValidator.validateAppointment, appointmentController.createAppointment);
app.put("/appointments/:appointmentID", verifyJWT, appointmentValidator.validateAppointment, appointmentValidator.validateAppointmentId, appointmentController.updateAppointmentByAppointmentID);
app.delete("/appointments/:appointmentID", verifyJWT, appointmentValidator.validateAppointmentId, appointmentController.deleteAppointment);
app.get("/appointments/search", verifyJWT, appointmentValidator.validateSearchQuery, appointmentController.searchAppointments);

// Meals
app.get("/meals/me", verifyJWT, mealValidator.validateMealQuery, mealController.getMealsByUserIDAndMealDate);
app.post("/meals", verifyJWT, mealValidator.validateMeal, mealController.createMealLog);
app.put("/meals/:mealID", verifyJWT, mealValidator.validateMeal, mealValidator.validateMealId, mealController.updateMealLogByMealID);
app.delete("/meals/:mealID", verifyJWT, mealValidator.validateMealId, mealController.deleteMealLogByMealID);

// ─── Group 5: Khaleel ───
// Medications
app.get("/api/medications/today", verifyJWT, medicationsController.getTodayMeds);
app.post("/api/medications", verifyJWT, medicationValidator, medicationsController.addMedication);
app.put("/api/medications/:medicationID/mark-taken", verifyJWT, medicationsController.markTaken);
app.get("/api/medications/upcoming", verifyJWT, medicationsController.getUpcomingMeds);
app.get("/medications/:medicationID", editMedicationsController.getMedicationById);
app.put("/medications/:medicationID", editMedicationsController.updateMedication);
app.delete("/medications/:medicationID", editMedicationsController.deleteMedication);

// Health Reminders
app.get("/reminders", verifyJWT, healthRemindersController.getReminders);
app.get("/reminders/upcoming", verifyJWT, healthRemindersController.getUpcomingReminders);
app.put("/reminders/:id/mark-taken", verifyJWT, healthRemindersController.markReminderTaken);
app.post("/reminders", verifyJWT, healthRemindersController.createReminder);
app.get("/reminders/:id", verifyJWT, editRemindersController.getReminderById);
app.put("/reminders/:id", verifyJWT, editRemindersController.updateReminder);
app.delete("/reminders/:id", verifyJWT, editRemindersController.deleteReminder);

// ─── Group 6: Wei Dai ───
// Posts
app.get("/posts", postsController.getAllPosts);
app.get("/posts/:id", verifyJWT, validatePostId, postsController.getPostById);
app.post("/posts", verifyJWT, validatePost, postsController.createPost);
app.put("/posts/:id", verifyJWT, postsController.updatePost);
app.delete("/posts/:id", verifyJWT, postsController.deletePost);

// Comments
app.get("/posts/:postID/comments", verifyJWT, postsController.getCommentsForPost);
app.post("/posts/:postID/comments", verifyJWT, postsController.createCommentForPost);
app.put("/posts/:postID/comments/:commentID", verifyJWT, postsController.updateComment);
app.delete("/posts/:postID/comments/:commentID", verifyJWT, postsController.deleteComment);

// Likes
app.post("/posts/:postID/like", verifyJWT, postsController.likePost);
app.delete("/posts/:postID/unlike", verifyJWT, postsController.unlikePost);
app.get("/posts/:postID/likes", verifyJWT, postsController.getLikes);

// Upload + Translation
app.post("/api/upload", uploadImage);
app.post("/translate", translateText);

// ─── Swagger UI ─────────────────────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ─── Medication Reset Job ──────────────────────────────────────────────────────
require('./models/reset_medication_status');

// ─── Start Server ───────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err.message);
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────────────
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connection closed");
  process.exit(0);
});
