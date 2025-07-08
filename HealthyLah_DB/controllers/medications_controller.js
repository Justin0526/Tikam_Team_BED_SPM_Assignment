const {
  fetchTodayMeds,
  insertMedication,
  updateMedicationAsTaken
} = require('../models/medication_models.js');

// GET /medications/today
async function getTodayMeds(req, res) {
  const userID = 1; // Replace with session user ID if available
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  try {
    const meds = await fetchTodayMeds(userID, start, end);
    res.status(200).json(meds);
  } catch (err) {
    console.error("Error fetching today’s meds:", err);
    res.status(500).send("Failed to retrieve medications");
  }
}

// POST /medications
async function addMedication(req, res) {
  const userID = 1; // Replace with actual user session logic
  const data = req.body;

  try {
    await insertMedication(userID, data);
    res.status(201).send("Medication added");
  } catch (err) {
    console.error("Error adding medication:", err);
    res.status(500).send("Failed to add medication");
  }
}

// PATCH /medications/:medicationID/mark-taken
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
  markTaken
};
