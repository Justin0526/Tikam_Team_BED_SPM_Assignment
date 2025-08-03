// Khaleel Anis S10270243D

const sql = require("mssql");
const dbConfig = require("../dbConfig");

const Reminder = require("../models/health_reminders_model");

// GET /reminders
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

// PUT /reminders/:id/mark-taken
async function markReminderTaken(req, res) {
  const id = req.params.id;
  const userID = req.user.userID;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("userID", sql.Int, userID)
      .query(`
        UPDATE Reminders 
        SET status = 'Taken'
        WHERE reminder_id = @id AND userID = @userID
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Reminder not found or unauthorized" });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ message: "Failed to update reminder" });
  }
}

// NEW: GET /reminders/upcoming
async function getUpcomingReminders(req, res) {
  const userID = req.user.userID;
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  try {
    const reminders = await Reminder.fetchUpcomingReminders(userID, now, oneHourLater);
    res.status(200).json(reminders);
  } catch (err) {
    console.error("Error fetching upcoming reminders:", err);
    res.status(500).json({ message: "Failed to fetch upcoming reminders" });
  }
}

// POST /reminders
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
  getUpcomingReminders,
  createReminder
};