const sql = require("mssql");
const dbConfig = require("../dbConfig");

const Reminder = require("../models/health_reminders_model");

async function getReminders(req, res) {
  try {
    const userID = req.user.userID;
    const data = await Reminder.getRemindersByUser(userID);
    res.json(data);
  } catch (err) {
    console.error("Error loading reminders:", err);
    res.status(500).json({ message: "Failed to load reminders" });
  }
}

async function markReminderTaken(req, res) {
  const id = req.params.id;

  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("id", sql.Int, id)
      .query("UPDATE Reminders SET status = 'Taken' WHERE reminder_id = @id");

    res.sendStatus(200);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ message: "Failed to update reminder" });
  }
}

async function createReminder(req, res) {
  try {
    const userID = req.user.userID;
    const { title, reminderTime, frequency, message, startDate, endDate } = req.body;

    await Reminder.createReminder({
    userID,
    title,
    reminderTime,
    frequency,
    message,
    startDate,
    endDate
    });

    res.status(201).json({ message: "Reminder added" });
  } catch (err) {
    console.error("Error creating reminder:", err);
    res.status(500).json({ message: "Failed to create reminder" });
  }
}

module.exports = {
  getReminders,
  markReminderTaken,
  createReminder
};