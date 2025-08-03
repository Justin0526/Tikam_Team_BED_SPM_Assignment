// Khaleel Anis S10270243D

const db = require('../dbConfig');
const sql = require('mssql');

const {
  fetchMedicationById,
  updateMedicationById
} = require('../models/edit_medication_model');

// GET /medications/:medicationID
async function getMedicationById(req, res) {
  const { medicationID } = req.params;
  try {
    const med = await fetchMedicationById(medicationID);
    if (!med) return res.status(404).send("Medication not found");
    res.status(200).json(med);
  } catch (err) {
    console.error("Error fetching medication:", err);
    res.status(500).send("Failed to retrieve medication");
  }
}

// PATCH /medications/:medicationID
async function updateMedication(req, res) {
  const { medicationID } = req.params;
  const data = req.body;
  try {
    await updateMedicationById(medicationID, data);
    res.status(200).send("Medication updated successfully");
  } catch (err) {
    console.error("Error updating medication:", err);
    res.status(500).send("Failed to update medication");
  }
}

// DELETE /medications/:medicationID
async function deleteMedication(req, res) {
  const { medicationID } = req.params;

  try {
    const connection = await sql.connect(db);
    await connection
      .request()
      .input('medicationID', sql.Int, parseInt(medicationID))
      .query("DELETE FROM Medications WHERE medicationID = @medicationID");

    res.status(200).json({ message: "Medication deleted successfully." });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete medication." });
  }
}

module.exports = {
  getMedicationById,
  updateMedication,
  deleteMedication
};