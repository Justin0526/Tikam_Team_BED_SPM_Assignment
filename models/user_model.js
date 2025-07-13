const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get all users
async function getAllUsers(){
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `SELECT * FROM Users`;
        const result = await connection.request().query(query);
        return result.recordset;
    }catch(error){
        console.error("Database error: ", error);
        throw error;
    }finally{
        if (connection){
            try{
                await connection.close();
            }catch(closeError){
                console.error("Error closing connection: ", closeError);
            }
        }
    }
}

// Get user by username
async function getUserByUsername(username){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `SELECT u.userID, u.fullName, username, email, passwordHash, gender 
                       FROM Users u INNER JOIN UserProfile up 
                       ON u.userID = up.userID 
                       WHERE username = @username`;
        const request = connection.request();
        request.input("username", username);
        const result = await request.query(query);
        
        if (result.recordset.length === 0){
            return null // User not found
        }

        return result.recordset[0];
    }catch(error){
        console.error("Database error: ",  error);
        throw error;
    }finally{
        if(connection){
            try{
                await connection.close();
            }catch(closeError){
                console.error("Error closing connection: ", closeError);
            }
        }
    }
}

// Create new user
async function createUser(userData){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = 
           `INSERT INTO Users (fullName, username, email, passwordHash) VALUES (@fullName, @username, @email, @passwordHash); 
            DECLARE @newUserID INT = SCOPE_IDENTITY();
            INSERT INTO UserProfile(userID, fullName) VALUES (@newUserID, @fullName);
            SELECT * FROM Users WHERE userID = @newUserID;`;
            // Declares get the new userID as a variable
        const request = connection.request();
        request.input("fullName", userData.fullName)
        request.input("username", userData.username);
        request.input("email", userData.email);
        request.input("passwordHash", userData.passwordHash);
        result = await request.query(query);

        const newUsername = result.recordset[0].username;
        return await getUserByUsername(newUsername);
    }catch(error){
        console.error("Database error: ", error);
        throw error;
    }finally{
        if (connection){
            try{
                await connection.close();
            }catch(closeError){
                console.error("Error closing connection: ", closeError);
            }
        }
    }
}

module.exports = {
    getAllUsers,
    getUserByUsername,
    createUser,
}
