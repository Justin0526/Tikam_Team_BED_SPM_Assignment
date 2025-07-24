const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get all health records for a user
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

// Add or update health record
async function addOrUpdateHealthRecord(userID, recordType, value1, value2, recordedAt) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    // Check if record exists
    const checkQuery = `
      SELECT * FROM HealthRecords
      WHERE userID = @userID AND recordType = @recordType AND recordedAt = @recordedAt
    `;
    const checkRequest = connection.request();
    checkRequest.input("userID", sql.Int, userID);
    checkRequest.input("recordType", sql.VarChar(20), recordType);
    checkRequest.input("recordedAt", sql.Date, recordedAt);
    const checkResult = await checkRequest.query(checkQuery);

    if (checkResult.recordset.length > 0) {
      // Update existing
      const updateQuery = `
        UPDATE HealthRecords
        SET value1 = @value1, value2 = @value2, updatedAt = GETDATE()
        WHERE userID = @userID AND recordType = @recordType AND recordedAt = @recordedAt
      `;
      const updateRequest = connection.request();
      updateRequest.input("userID", sql.Int, userID);
      updateRequest.input("recordType", sql.VarChar(20), recordType);
      updateRequest.input("recordedAt", sql.Date, recordedAt);
      updateRequest.input("value1", sql.Float, value1);
      updateRequest.input("value2", sql.Float, value2 || null);
      await updateRequest.query(updateQuery);
      return { message: "Record updated" };
    } else {
      // Insert new
      const insertQuery = `
        INSERT INTO HealthRecords (userID, recordType, value1, value2, recordedAt)
        VALUES (@userID, @recordType, @value1, @value2, @recordedAt)
      `;
      const insertRequest = connection.request();
      insertRequest.input("userID", sql.Int, userID);
      insertRequest.input("recordType", sql.VarChar(20), recordType);
      insertRequest.input("recordedAt", sql.Date, recordedAt);
      insertRequest.input("value1", sql.Float, value1);
      insertRequest.input("value2", sql.Float, value2 || null);
      await insertRequest.query(insertQuery);
      return { message: "Record added" };
    }
  } catch (error) {
    console.error("Database error (addOrUpdateHealthRecord):", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Delete a health record by ID
async function deleteHealthRecord(recordID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `DELETE FROM HealthRecords WHERE recordID = @recordID`;
    const request = connection.request();
    request.input("recordID", sql.Int, recordID);
    await request.query(query);
    return { message: "Record deleted" };
  } catch (error) {
    console.error("Database error (deleteHealthRecord):", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getHealthRecordsByUser,
  addOrUpdateHealthRecord,
  deleteHealthRecord,
};
