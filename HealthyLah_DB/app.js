const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");

//Load environment variables
const weatherController = require("./controllers/weather_controller");

// Create express app
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Ensure extended is true for urlencoded

// --- Serve static files from the 'public' directory ---
// When a request comes in for a static file (like /index.html, /styles.css, /script.js),
// Express will look for it in the 'public' folder relative to the project root.
app.use(express.static(path.join(__dirname, "public")));

// Route for weather 
app.get("/weather", weatherController.getWeather);

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

// Graceful shutdown
process.on("SIGINT", async() => {
    console.log("Server is gracefully shutting down");
    // close any open connections
    await sql.close();
    console.log("Database connection closed");
    process.exit(0); // Exit the process
})