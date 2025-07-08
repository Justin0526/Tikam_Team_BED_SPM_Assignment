const sql = require("mssql");
const dbConfig = require("../dbConfig.js");

async function fetchTodayMeds(userID, start, end) {
  const pool = await sql.connect(dbConfig);

  const result = await pool.request()
    .input('userID', sql.Int, userID)
    .input('start', sql.DateTime, start)
    .input('end', sql.DateTime, end)
    .query(`
      SELECT * FROM Medications 
      WHERE userID = @userID 
        AND startDate <= @end 
        AND (endDate IS NULL OR endDate >= @start)
    `);

  console.log(result);
  console.log(result.recordset)
  return result.recordset;
}

// AddMedication and markTaken follow the same pattern
async function insertMedication(userID, data) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('userID', sql.Int, userID)
    .input('medicineName', sql.NVarChar, data.medicineName)
    .input('dosage', sql.NVarChar, data.dosage)
    .input('frequency', sql.NVarChar, data.frequency)
    .input('consumptionTime', sql.Time, data.consumptionTime)
    .input('startDate', sql.DateTime, data.startDate)
    .input('endDate', sql.DateTime, data.endDate || null)
    .input('notes', sql.NVarChar, data.notes || '')
    .query(`
      INSERT INTO Medications 
      (userID, medicineName, dosage, frequency, consumptionTime, startDate, endDate, notes)
      VALUES (@userID, @medicineName, @dosage, @frequency, @consumptionTime, @startDate, @endDate, @notes)
    `);
}

async function updateMedicationAsTaken(medicationID) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('medicationID', sql.Int, medicationID)
    .query(`
      UPDATE Medications
      SET status = 'Taken'
      WHERE medicationID = @medicationID
    `);
}

module.exports = {
  fetchTodayMeds,
  insertMedication,
  updateMedicationAsTaken
};
