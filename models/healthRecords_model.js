const sql = require("mssql");
const dbConfig = require("../dbConfig");

// ✅ READ - Get all health records for a user
async function getHealthRecordsByUser(userID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT * FROM HealthRecords
      WHERE userID = @userID
      ORDER BY recordedAt ASC
    `;
    const request = connection.request();
    request.input("userID", sql.Int, userID);
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error (getHealthRecordsByUser):", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// ✅ CREATE - Add new health record
async function addHealthRecord(userID, recordType, value1, value2, recordedAt) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const insertQuery = `
      INSERT INTO HealthRecords (userID, recordType, value1, value2, recordedAt)
      VALUES (@userID, @recordType, @value1, @value2, @recordedAt)
    `;
    const request = connection.request();
    request.input("userID", sql.Int, userID);
    request.input("recordType", sql.VarChar(20), recordType);
    request.input("value1", sql.Float, value1);
    request.input("value2", sql.Float, value2 || null);
    request.input("recordedAt", sql.Date, recordedAt);
    await request.query(insertQuery);
    return { message: "Record added successfully" };
  } catch (error) {
    console.error("Database error (addHealthRecord):", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// ✅ UPDATE - Update record by recordID
async function updateHealthRecord(recordID, value1, value2, recordedAt) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const updateQuery = `
      UPDATE HealthRecords
      SET value1 = @value1, value2 = @value2, recordedAt = @recordedAt, updatedAt = GETDATE()
      WHERE recordID = @recordID
    `;
    const request = connection.request();
    request.input("recordID", sql.Int, recordID);
    request.input("value1", sql.Float, value1);
    request.input("value2", sql.Float, value2 || null);
    request.input("recordedAt", sql.Date, recordedAt);
    await request.query(updateQuery);
    return { message: "Record updated successfully" };
  } catch (error) {
    console.error("Database error (updateHealthRecord):", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// ✅ DELETE - Delete a health record by ID
async function deleteHealthRecord(recordID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `DELETE FROM HealthRecords WHERE recordID = @recordID`;
    const request = connection.request();
    request.input("recordID", sql.Int, recordID);
    await request.query(query);
    return { message: "Record deleted successfully" };
  } catch (error) {
    console.error("Database error (deleteHealthRecord):", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getHealthRecordsByUser,
  addHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
};
