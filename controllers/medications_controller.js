const{
  fetchTodayMeds,
  insertMedication,
  updateMedicationAsTaken,
  fetchUpcomingMeds
} = require('../models/medication_models.js');

// GET /medications/today
// Returns today's medications for the current user.
// Calculates the start and end timestamps for the current day.
async function getTodayMeds(req, res) {
  const userID = 1; // Hardcode a test user ID

  // Date objects in JS default to current time. We adjust it below:
  const start = new Date();            // e.g. 2025-07-13T07:12:00.000Z (now)
  start.setHours(0, 0, 0, 0);          // → 2025-07-13T00:00:00.000Z

  const end = new Date();              // Another new Date instance
  end.setHours(23, 59, 59, 999);       // → 2025-07-13T23:59:59.999Z

  try {
    const meds = await fetchTodayMeds(userID, start, end);
    res.status(200).json(meds);
  } catch (err) {
    console.error("Error fetching today’s meds:", err);
    res.status(500).send("Failed to retrieve medications");
  }
}

// GET /medications/upcoming
async function getUpcomingMeds(req, res) {
  const userID = 1; // Replace with actual logged-in user ID in future
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

  try {
    const meds = await fetchUpcomingMeds(userID, now, nextHour);
    res.status(200).json(meds);
  } catch (err) {
    console.error("Error fetching upcoming meds:", err);
    res.status(500).send("Failed to retrieve upcoming medications");
  }
}


// POST /medications
// Adds a new medication record for the logged-in user.
async function addMedication(req, res) {
  const userID = 1; // Hardcode a test user ID
  const data = req.body;

  try {
    await insertMedication(userID, data);
    res.status(201).send("Medication added");
  } catch (err) {
    console.error("Error adding medication:", err);
    res.status(500).send("Failed to add medication");
  }
}

// PUT /medications/:medicationID/mark-taken
// Marks the given medication as 'Taken' (was previously PATCH).
async function markTaken(req, res) {
  const { medicationID } = req.params;

  try {
    await updateMedicationAsTaken(medicationID);
    res.status(200).send("Medication marked as taken");
  } catch (err) {
    console.error("Error marking medication as taken:", err);
    res.status(500).send("Failed to update medication status");
  }
}

module.exports = {
  getTodayMeds,
  addMedication,
  markTaken,
  getUpcomingMeds
};