const sql = require('mssql');
const dbConfig = require('../dbConfig');

const getUserHealthProfile = async (req, res) => {
const userID = req.user.userID;

try {
    await sql.connect(dbConfig);
    const result = await sql.query`
    SELECT fullName, dob, gender, allergies, chronicConditions, emergencyName, emergencyNumber
    FROM UserProfile WHERE userID = ${userID}`;

    if (result.recordset.length === 0) {
    return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(result.recordset[0]);
} catch (error) {
    console.error('Error fetching user health profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
};

module.exports = {
getUserHealthProfile
};