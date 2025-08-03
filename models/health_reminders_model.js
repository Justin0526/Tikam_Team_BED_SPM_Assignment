// Khaleel Anis S10270243D

// Import the mssql library for SQL Server database operations
const sql = require("mssql");
// Import database configuration for connecting to the SQL Server
const dbConfig = require("../dbConfig");

/**
 * Retrieve all reminders for a specific user.
 * - Connects to the database and fetches all reminders linked to the provided user ID.
 * - Orders the results by start date (earliest first) and reminder time.
 *
 * @param {number} userID - The ID of the user whose reminders are to be fetched.
 * @returns {Promise<Array>} An array of reminder records for the user.
 */
async function getRemindersByUser(userID) {
  const pool = await sql.connect(dbConfig); // Establish database connection
  const result = await pool.request()
    .input("userID", sql.Int, userID) // Bind userID as a parameter to prevent SQL injection
    .query(`
      SELECT reminder_id, title, reminderTime, frequency, message, startDate, endDate, status
      FROM Reminders
      WHERE userID = @userID
      ORDER BY startDate ASC, reminderTime ASC
    `);
  return result.recordset; // Return all reminders for the user
}

/**
 * Fetch reminders scheduled within the next hour for a user.
 * - Filters reminders that:
 *   - Belong to the specified user.
 *   - Have not been marked as 'Taken'.
 *   - Fall within the current hour window.
 *   - Are active based on their start and end dates.
 *
 * @param {number} userID - The user's ID to filter reminders.
 * @param {Date} now - The current timestamp.
 * @param {Date} oneHourLater - The timestamp representing one hour from now.
 * @returns {Promise<Array>} An array of reminders due within the next hour.
 */
async function fetchUpcomingReminders(userID, now, oneHourLater) {
  const pool = await sql.connect(dbConfig); // Establish database connection
  
  // Convert Date objects to "HH:MM:SS" format strings for SQL comparison
  const nowStr = now.toTimeString().split(" ")[0]; 
  const nextHourStr = oneHourLater.toTimeString().split(" ")[0];

  const result = await pool.request()
    .input("userID", sql.Int, userID)        // Bind user ID
    .input("now", sql.VarChar(8), nowStr)    // Bind current time
    .input("nextHour", sql.VarChar(8), nextHourStr) // Bind next hour time
    .query(`
      SELECT reminder_id, title, reminderTime, frequency, message, startDate, endDate, status
      FROM Reminders
      WHERE userID = @userID
        AND status != 'Taken'
        AND CAST(reminderTime AS TIME) >= @now
        AND CAST(reminderTime AS TIME) < @nextHour
        AND CAST(GETDATE() AS DATE) BETWEEN CAST(startDate AS DATE) AND ISNULL(CAST(endDate AS DATE), GETDATE())
    `);

  return result.recordset; // Return reminders due in the upcoming hour
}

/**
 * Create a new reminder for a user.
 * - Inserts a new reminder record into the database with the provided details.
 * - Automatically sets the reminder status to 'Not Yet' upon creation.
 *
 * @param {Object} reminderData - The reminder details.
 * @param {number} reminderData.userID - ID of the user creating the reminder.
 * @param {string} reminderData.title - Title of the reminder.
 * @param {string} reminderData.reminderTime - Time of the reminder (HH:MM:SS format).
 * @param {string} reminderData.frequency - Frequency (e.g., Daily, Weekly).
 * @param {string} [reminderData.message] - Optional reminder message.
 * @param {string} reminderData.startDate - Start date of the reminder.
 * @param {string|null} [reminderData.endDate] - Optional end date of the reminder.
 */
async function createReminder({ userID, title, reminderTime, frequency, message, startDate, endDate }) {
  const pool = await sql.connect(dbConfig); // Establish database connection
  await pool.request()
    .input("userID", sql.Int, userID) // Bind user ID
    .input("title", sql.VarChar(100), title) // Bind title (max 100 chars)
    .input("reminderTime", sql.VarChar(8), reminderTime) // Bind reminder time
    .input("frequency", sql.VarChar(50), frequency) // Bind frequency (max 50 chars)
    .input("message", sql.VarChar(255), message || null) // Bind optional message
    .input("startDate", sql.Date, startDate) // Bind start date
    .input("endDate", sql.Date, endDate || null) // Bind end date or set NULL
    .query(`
      INSERT INTO Reminders (userID, title, reminderTime, frequency, message, startDate, endDate, status)
      VALUES (@userID, @title, @reminderTime, @frequency, @message, @startDate, @endDate, 'Not Yet')
    `);
}

// Export functions for use in controllers or other modules
module.exports = {
  getRemindersByUser,
  fetchUpcomingReminders,
  createReminder
};