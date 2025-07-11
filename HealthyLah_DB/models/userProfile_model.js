// models/profile.js
const { sql, poolPromise } = require('../dbConfig');

async function updateUserProfile(userID, data) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userID', sql.Int, userID)
      .input('fullName', sql.VarChar(100), data.fullName)
      .input('dob', sql.Date, data.dob)
      .input('gender', sql.VarChar(20), data.gender)
      .input('allergies', sql.VarChar(100), data.allergies)
      .input('conditions', sql.VarChar(100), data.conditions)
      .input('emergencyName', sql.VarChar(100), data.emergencyName)
      .input('emergencyNumber', sql.VarChar(20), data.emergencyNumber)
      .input('address', sql.VarChar(255), data.address)
      .input('bio', sql.VarChar(500), data.bio)
      .query(`
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
  } catch (err) {
    throw err;
  }
}

async function getUserProfile(userID) {
  try {
    const pool = await poolPromise;
    return await pool.request()
      .input('userID', sql.Int, userID)
      .query(`
        SELECT * FROM UserProfile WHERE userID = @userID
      `);
  } catch (err) {
    throw err;
  }
}


module.exports = { updateUserProfile, getUserProfile };
