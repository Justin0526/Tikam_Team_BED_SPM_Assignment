const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getUserProfile(userID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('userID', sql.Int, userID);
    const result = await request.query("SELECT * FROM UserProfile WHERE userID = @userID");

    if (result.recordset.length === 0) {
      return null; // No profile found
    }

    return result.recordset[0];
  } catch (error) {
    console.error("Database error (getUserProfile):", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }
  }
}

async function updateUserProfile(userID, data) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();

    request.input('userID', sql.Int, userID);
    request.input('fullName', sql.VarChar(100), data.fullName);
    request.input('dob', sql.Date, data.dob);
    request.input('gender', sql.VarChar(20), data.gender);
    request.input('allergies', sql.VarChar(100), data.allergies);
    request.input('conditions', sql.VarChar(100), data.conditions);
    request.input('emergencyName', sql.VarChar(100), data.emergencyName);
    request.input('emergencyNumber', sql.VarChar(20), data.emergencyNumber);
    request.input('address', sql.VarChar(255), data.address);
    request.input('bio', sql.VarChar(500), data.bio);

    const result = await request.query(`
      UPDATE UserProfile SET
        fullName = @fullName,
        dob = @dob,
        gender = @gender,
        allergies = @allergies,
        chronicConditions = @conditions,
        emergencyName = @emergencyName,
        emergencyNumber = @emergencyNumber,
        address = @address,
        bio = @bio,
        updatedAt = GETDATE()
      WHERE userID = @userID
    `);

    return result;
  } catch (error) {
    console.error("Database error (updateUserProfile):", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
};
