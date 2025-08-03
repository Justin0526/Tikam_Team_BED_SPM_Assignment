// Khaleel Anis S10270243D

// Import the Reminder model that interacts with the database for reminder-related operations
const Reminder = require("../models/edit_reminders_model");

/**
 * Fetch a reminder by its ID.
 * - Extracts the ID from the request parameters.
 * - Retrieves the reminder from the database using the model.
 * - Returns a 404 status if the reminder is not found.
 * - Responds with the reminder data in JSON format if found.
 * - Handles errors and responds with a 500 status in case of server issues.
 */
async function getReminderById(req, res) {
  try {
    const id = parseInt(req.params.id); // Convert ID from request parameters to an integer
    const reminder = await Reminder.getReminderById(id); // Fetch reminder by ID

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" }); // Return 404 if not found
    }

    res.json(reminder); // Return reminder data if found
  } catch (err) {
    console.error("Error fetching reminder:", err); // Log error
    res.status(500).json({ message: "Failed to fetch reminder" }); // Send server error response
  }
}

/**
 * Update an existing reminder by its ID.
 * - Extracts the ID from the request parameters.
 * - Updates the reminder with the data provided in the request body.
 * - Sends a 200 status if the update is successful.
 * - Handles errors and responds with a 500 status in case of server issues.
 */
async function updateReminder(req, res) {
  try {
    const id = parseInt(req.params.id); // Convert ID from request parameters to an integer
    await Reminder.updateReminder(id, req.body); // Update reminder with provided data
    res.sendStatus(200); // Send success response if update is successful
  } catch (err) {
    console.error("Error updating reminder:", err); // Log error
    res.status(500).json({ message: "Failed to update reminder" }); // Send server error response
  }
}

/**
 * Delete a reminder by its ID.
 * - Extracts the ID from the request parameters.
 * - Deletes the reminder from the database using the model.
 * - Sends a 200 status if deletion is successful.
 * - Handles errors and responds with a 500 status in case of server issues.
 */
async function deleteReminder(req, res) {
  try {
    const id = parseInt(req.params.id); // Convert ID from request parameters to an integer
    await Reminder.deleteReminder(id); // Delete reminder by ID
    res.sendStatus(200); // Send success response if deletion is successful
  } catch (err) {
    console.error("Error deleting reminder:", err); // Log error
    res.status(500).json({ message: "Failed to delete reminder" }); // Send server error response
  }
}

// Export the functions to be used in routes or other modules
module.exports = {
  getReminderById,
  updateReminder,
  deleteReminder
};