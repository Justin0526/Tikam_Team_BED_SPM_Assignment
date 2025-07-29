const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getUserProfile(userID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request()
      .input('userID', sql.Int, userID)
      .query("SELECT userID, fullName, dob, gender, allergies, chronicConditions, emergencyName, emergencyNumber, address, bio, profilePicture FROM UserProfile WHERE userID = @userID");
    return result.recordset.length ? result.recordset[0] : null;
  } catch (error) {
    console.error("❌ Database error (getUserProfile):", error);
    throw error;
  } finally {
    if (connection) await connection.close();
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
    request.input('allergies', sql.VarChar(255), data.allergies);
    request.input('conditions', sql.VarChar(255), data.conditions);
    request.input('emergencyName', sql.VarChar(100), data.emergencyName);
    request.input('emergencyNumber', sql.VarChar(20), data.emergencyNumber);
    request.input('address', sql.VarChar(255), data.address);
    request.input('bio', sql.VarChar(500), data.bio);
    request.input('profilePicture', sql.VarChar(500), data.profilePicture);

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
        profilePicture = @profilePicture,  -- ✅ Must be here
        updatedAt = GETDATE()
      WHERE userID = @userID
    `);
    return result;
  } catch (error) {
    console.error("❌ Database error (updateUserProfile):", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { getUserProfile, updateUserProfile };
