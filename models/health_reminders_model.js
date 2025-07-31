const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getRemindersByUser(userID) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("userID", sql.Int, userID)
    .query(`
      SELECT reminder_id, title, reminderTime, frequency, message, startDate, endDate, status
      FROM Reminders
      WHERE userID = @userID
      ORDER BY startDate ASC, reminderTime ASC
    `);
  return result.recordset;
}

// ✅ FIXED: Proper model-level fetchUpcomingReminders
async function fetchUpcomingReminders(userID, now, oneHourLater) {
  const pool = await sql.connect(dbConfig);
  const nowStr = now.toTimeString().split(" ")[0]; 
  const nextHourStr = oneHourLater.toTimeString().split(" ")[0];

  const result = await pool.request()
    .input("userID", sql.Int, userID)
    .input("now", sql.VarChar(8), nowStr)
    .input("nextHour", sql.VarChar(8), nextHourStr)
    .query(`
      SELECT reminder_id, title, reminderTime, frequency, message, startDate, endDate, status
      FROM Reminders
      WHERE userID = @userID
        AND status != 'Taken'
        AND CAST(reminderTime AS TIME) >= @now
        AND CAST(reminderTime AS TIME) < @nextHour
        AND CAST(GETDATE() AS DATE) BETWEEN CAST(startDate AS DATE) AND ISNULL(CAST(endDate AS DATE), GETDATE())
    `);

  return result.recordset;
}

async function createReminder({ userID, title, reminderTime, frequency, message, startDate, endDate }) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input("userID", sql.Int, userID)
    .input("title", sql.VarChar(100), title)
    .input("reminderTime", sql.VarChar(8), reminderTime)
    .input("frequency", sql.VarChar(50), frequency)
    .input("message", sql.VarChar(255), message || null)
    .input("startDate", sql.Date, startDate)
    .input("endDate", sql.Date, endDate || null)
    .query(`
      INSERT INTO Reminders (userID, title, reminderTime, frequency, message, startDate, endDate, status)
      VALUES (@userID, @title, @reminderTime, @frequency, @message, @startDate, @endDate, 'Not Yet')
    `);
}

module.exports = {
  getRemindersByUser,
  fetchUpcomingReminders,
  createReminder
};