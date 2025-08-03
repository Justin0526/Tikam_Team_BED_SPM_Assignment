// Khaleel Anis S10270243D

// Import the mssql library for SQL Server database operations
const sql = require('mssql');
// Import the database configuration to establish a connection
const dbConfig = require('../dbConfig');

/**
 * Fetch the health profile of the currently logged-in user.
 * - Retrieves the `userID` from the authenticated request object.
 * - Connects to the SQL Server database using the provided configuration.
 * - Executes a query to retrieve the user's health profile details (full name, date of birth, gender, allergies, chronic conditions, and emergency contact).
 * - Returns a 404 response if no profile is found for the given user ID.
 * - Returns the health profile data in JSON format if found.
 * - Logs and returns a 500 error if a database or server error occurs.
 */
const getUserHealthProfile = async (req, res) => {
  const userID = req.user.userID; // Extract userID from authenticated user request

  try {
    // Establish a connection to the database
    await sql.connect(dbConfig);

    // Query the database for the user's health profile based on their userID
    const result = await sql.query`
      SELECT fullName, dob, gender, allergies, chronicConditions, emergencyName, emergencyNumber
      FROM UserProfile WHERE userID = ${userID}`;

    // If no records are found, return a 404 response
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If a record is found, return the first result as the user's health profile
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    // Log the error and return a 500 Internal Server Error response
    console.error('Error fetching user health profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Export the function to be used in routes or controllers
module.exports = {
  getUserHealthProfile
};