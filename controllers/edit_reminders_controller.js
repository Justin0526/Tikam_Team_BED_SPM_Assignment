const Reminder = require("../models/edit_reminders_model");

async function getReminderById(req, res) {
  try {
    const id = parseInt(req.params.id);
    const reminder = await Reminder.getReminderById(id);

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    res.json(reminder);
  } catch (err) {
    console.error("❌ Error fetching reminder:", err);
    res.status(500).json({ message: "Failed to fetch reminder" });
  }
}

async function updateReminder(req, res) {
  try {
    const id = parseInt(req.params.id);
    await Reminder.updateReminder(id, req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error updating reminder:", err);
    res.status(500).json({ message: "Failed to update reminder" });
  }
}

async function deleteReminder(req, res) {
  try {
    const id = parseInt(req.params.id);
    await Reminder.deleteReminder(id);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error deleting reminder:", err);
    res.status(500).json({ message: "Failed to delete reminder" });
  }
}

module.exports = {
  getReminderById,
  updateReminder,
  deleteReminder
};