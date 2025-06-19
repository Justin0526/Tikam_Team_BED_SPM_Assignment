const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");

//Load environment variables
const weatherController = require("./controllers/weather_controller");

// Create express app
const app = express();
const port = process.env.PORT || 3000;

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