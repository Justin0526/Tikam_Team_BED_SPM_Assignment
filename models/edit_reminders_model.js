const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getReminderById(reminderID) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("reminderID", sql.Int, reminderID)
    .query(`
      SELECT reminder_id, title, reminderTime, frequency, message, startDate, endDate
      FROM Reminders
      WHERE reminder_id = @reminderID
    `);
  return result.recordset[0];
}

async function updateReminder(reminderID, data) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input("reminderID", sql.Int, reminderID)
    .input("title", sql.VarChar(100), data.title)
    .input("reminderTime", sql.Time, new Date(`1970-01-01T${data.reminderTime}`))
    .input("frequency", sql.VarChar(50), data.frequency)
    .input("message", sql.VarChar(255), data.message)
    .input("startDate", sql.Date, data.startDate)
    .input("endDate", sql.Date, data.endDate || null)
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

async function deleteReminder(reminderID) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input("reminderID", sql.Int, reminderID)
    .query("DELETE FROM Reminders WHERE reminder_id = @reminderID");
}

module.exports = {
  getReminderById,
  updateReminder,
  deleteReminder
};