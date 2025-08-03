// Khaleel Anis S10270243D

// Import the mssql library for database interaction with SQL Server
const sql = require("mssql");
// Import the database configuration to establish the connection
const dbConfig = require("../dbConfig");

/**
 * Fetch a reminder by its ID from the database.
 * - Establishes a database connection.
 * - Executes a SELECT query to retrieve reminder details by reminder_id.
 * - Returns the reminder record if found.
 *
 * @param {number} reminderID - The ID of the reminder to fetch.
 * @returns {object} The reminder record, or undefined if not found.
 */
async function getReminderById(reminderID) {
  const pool = await sql.connect(dbConfig); // Connect to database
  const result = await pool.request()
    .input("reminderID", sql.Int, reminderID) // Bind reminderID as a parameter to prevent SQL injection
    .query(`
      SELECT reminder_id, title, reminderTime, frequency, message, startDate, endDate
      FROM Reminders
      WHERE reminder_id = @reminderID
    `);
  return result.recordset[0]; // Return the first matching record
}

/**
 * Update an existing reminder in the database.
 * - Establishes a database connection.
 * - Executes an UPDATE query with the provided reminder data.
 *
 * @param {number} reminderID - The ID of the reminder to update.
 * @param {object} data - The updated reminder data (title, time, frequency, etc.).
 */
async function updateReminder(reminderID, data) {
  const pool = await sql.connect(dbConfig); // Connect to database
  await pool.request()
    .input("reminderID", sql.Int, reminderID) // Bind reminder ID
    .input("title", sql.VarChar(100), data.title) // Update title (max 100 chars)
    .input("reminderTime", sql.Time, new Date(`1970-01-01T${data.reminderTime}`)) // Convert time string to Time
    .input("frequency", sql.VarChar(50), data.frequency) // Update frequency (max 50 chars)
    .input("message", sql.VarChar(255), data.message) // Update message (max 255 chars)
    .input("startDate", sql.Date, data.startDate) // Update start date
    .input("endDate", sql.Date, data.endDate || null) // Update end date or set NULL if not provided
    .query(`
      UPDATE Reminders SET
        title = @title,
        reminderTime = @reminderTime,
        frequency = @frequency,
        message = @message,
        startDate = @startDate,
        endDate = @endDate
      WHERE reminder_id = @reminderID
    `);
}

/**
 * Delete a reminder from the database by its ID.
 * - Establishes a database connection.
 * - Executes a DELETE query to remove the reminder.
 *
 * @param {number} reminderID - The ID of the reminder to delete.
 */
async function deleteReminder(reminderID) {
  const pool = await sql.connect(dbConfig); // Connect to database
  await pool.request()
    .input("reminderID", sql.Int, reminderID) // Bind reminder ID
    .query("DELETE FROM Reminders WHERE reminder_id = @reminderID"); // Execute DELETE query
}

// Export functions for use in controllers or other modules
module.exports = {
  getReminderById,
  updateReminder,
  deleteReminder
};