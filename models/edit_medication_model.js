// Khaleel Anis S10270243D

const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Get medication by ID
async function fetchMedicationById(medicationID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request()
      .input('medicationID', sql.Int, medicationID)
      .query(`SELECT * FROM Medications WHERE medicationID = @medicationID`);
    return result.recordset[0];
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Update medication by ID
async function updateMedicationById(medicationID, data) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    await connection.request()
      .input('medicationID', sql.Int, medicationID)
      .input('medicineName', sql.NVarChar, data.medicineName)
      .input('dosage', sql.NVarChar, data.dosage)
      .input('frequency', sql.NVarChar, data.frequency)
      .input('consumptionTime', sql.VarChar(8), data.consumptionTime)
      .input('startDate', sql.DateTime, data.startDate)
      .input('endDate', sql.DateTime, data.endDate || null)
      .input('notes', sql.NVarChar, data.notes || '')
      .query(`
        UPDATE Medications SET
          medicineName = @medicineName,
          dosage = @dosage,
          frequency = @frequency,
          consumptionTime = @consumptionTime,
          startDate = @startDate,
          endDate = @endDate,
          notes = @notes
        WHERE medicationID = @medicationID
      `);
  } finally {
    sql.close();
  }
}

module.exports = {
  fetchMedicationById,
  updateMedicationById
};