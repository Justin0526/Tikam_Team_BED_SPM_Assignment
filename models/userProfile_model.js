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
    if (connection) {
        try{
            await connection.close();
        }catch(closeError){
            console.error("Error closing connection: ", closeError);
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
    request.input('fullName', sql.VarChar(100), data.fullName || null);
    request.input('dob', sql.Date, data.dob || null);
    request.input('gender', sql.VarChar(20), data.gender || null);
    request.input('allergies', sql.VarChar(255), data.allergies || null);
    request.input('conditions', sql.VarChar(255), data.conditions || null);
    request.input('emergencyName', sql.VarChar(100), data.emergencyName || null);
    request.input('emergencyNumber', sql.VarChar(20), data.emergencyNumber || null);
    request.input('address', sql.VarChar(255), data.address || null);
    request.input('bio', sql.VarChar(500), data.bio || null);

    const profilePicValue = data.profilePicture && data.profilePicture.trim() !== '' ? data.profilePicture : null;
    request.input('profilePicture', sql.VarChar(500), profilePicValue);

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
        profilePicture = @profilePicture,
        updatedAt = GETDATE()
      WHERE userID = @userID
    `);
    return result;
  } catch (error) {
    console.error("❌ Database error (updateUserProfile):", error);
    throw error;
  } finally {
    if (connection) {
        try{
            await connection.close();
        }catch(closeError){
            console.error("Error closing connection: ", closeError);
        }
    }
  }
}

async function removeProfilePicture(userID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request()
      .input('userID', sql.Int, userID)
      .query(`
        UPDATE UserProfile
        SET profilePicture = NULL, updatedAt = GETDATE()
        WHERE userID = @userID
      `);
    return result;
  } catch (error) {
    console.error("❌ Database error (removeProfilePicture):", error);
    throw error;
  } finally {
    if (connection) {
        try{
            await connection.close();
        }catch(closeError){
            console.error("Error closing connection: ", closeError);
        }
    }
  }
}

module.exports = { getUserProfile, updateUserProfile, removeProfilePicture };
