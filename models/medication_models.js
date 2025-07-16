const sql = require("mssql");
const dbConfig = require("../dbConfig.js");

/**
 * Fetches medications scheduled for today for a specific user.
 */
async function fetchTodayMeds(userID, start, end) {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('userID', sql.Int, userID)
      .input('start', sql.DateTime, start)
      .input('end', sql.DateTime, end)
      .query(`
        SELECT * FROM Medications 
        WHERE userID = @userID 
          AND startDate <= @end 
          AND (endDate IS NULL OR endDate >= @start)
          AND (status IS NULL or status != 'Taken')
      `);
    return result.recordset;
  } catch (err) {
    console.error("Database error in fetchTodayMeds:", err);
    throw err;
  } finally {
    sql.close();
  }
}

async function fetchUpcomingMeds(userID, now, oneHourLater) {
  let pool;
  try {
    pool = await sql.connect(dbConfig);

    // Convert times to HH:mm:ss format
    const nowStr = now.toTimeString().split(' ')[0];         // "HH:mm:ss"
    const nextHourStr = oneHourLater.toTimeString().split(' ')[0];

    const result = await pool.request()
      .input('userID', sql.Int, userID)
      .input('now', sql.VarChar(8), nowStr)
      .input('nextHour', sql.VarChar(8), nextHourStr)
      .query(`
        SELECT * FROM Medications 
        WHERE userID = @userID
          AND status != 'Taken'
          AND CAST(consumptionTime AS TIME) >= @now
          AND CAST(consumptionTime AS TIME) < @nextHour
          AND CAST(GETDATE() AS DATE) BETWEEN CAST(startDate AS DATE) AND ISNULL(CAST(endDate AS DATE), GETDATE())
      `);

    return result.recordset;
  } finally {
    sql.close();
  }
}

/**
 * Inserts a new medication record into the database.
 */
async function insertMedication(userID, data) {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    await pool.request()
      .input('userID', sql.Int, userID)
      .input('medicineName', sql.NVarChar, data.medicineName)
      .input('dosage', sql.NVarChar, data.dosage)
      .input('frequency', sql.NVarChar, data.frequency)
      .input('consumptionTime', sql.VarChar(8), data.consumptionTime)
      .input('startDate', sql.DateTime, data.startDate)
      .input('endDate', sql.DateTime, data.endDate || null)
      .input('notes', sql.NVarChar, data.notes || '')
      .query(`
        INSERT INTO Medications 
        (userID, medicineName, dosage, frequency, consumptionTime, startDate, endDate, notes)
        VALUES (@userID, @medicineName, @dosage, @frequency, @consumptionTime, @startDate, @endDate, @notes)
      `);
  } catch (err) {
    console.error("Database error in insertMedication:", err);
    throw err;
  } finally {
    sql.close();
  }
}

/**
 * Updates a medication’s status to "Taken".
 */
async function updateMedicationAsTaken(medicationID) {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    await pool.request()
      .input('medicationID', sql.Int, medicationID)
      .query(`
        UPDATE Medications
        SET status = 'Taken'
        WHERE medicationID = @medicationID
      `);
  } catch (err) {
    console.error("Database error in updateMedicationAsTaken:", err);
    throw err;
  } finally {
    sql.close();
  }
}

module.exports = {
  fetchTodayMeds,
  insertMedication,
  updateMedicationAsTaken,
  fetchUpcomingMeds
};