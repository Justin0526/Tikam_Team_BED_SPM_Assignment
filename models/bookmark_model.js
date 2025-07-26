const sql = require("mssql");
const dbConfig = require("../dbConfig");

// get all bookmarks of the user
async function getAllBookmarks(userID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `SELECT * FROM Bookmarks WHERE userID = @userID`;
        const request = connection.request();
        request.input("userID", userID);
        const result = await request.query(query);

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

// Get bookmark by place Id
async function getBookmarkByPlaceID(userID, placeID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `SELECT COUNT(*) as count FROM Bookmarks WHERE userID = @userID AND placeID = @placeID`;
        const request = connection.request();
        request.input("userID", userID);
        request.input("placeID", placeID);
        const result = await request.query(query);

        if(result.recordset[0].count > 0){
            const error = new Error("User has already bookmarked this place");
            error.statusCode = 409; // conflict
            throw error;
        }
    }catch(error){
        if(error.statusCode !== 409){
            console.error("Database error: ", error);
        }
        throw error;
    }finally{
        if(connection){
            try{
                await connection.close();
            }catch(closeError){
                console.error("Error closing database connection: ", closeError);
            }
        }
    }
}

// Create new bookmark
async function createNewBookmark(userID, placeID){
    let connection;
    try{
        // Check if the user has already bookmarked this place
        await getBookmarkByPlaceID(userID, placeID);

        connection = await sql.connect(dbConfig);
        // If no, insert new record
        const query = `INSERT INTO Bookmarks (userID, placeID) VALUES (@userID, @placeID)`
        const request = connection.request();
        request.input("userID", userID);
        request.input("placeID", placeID);
        const result = await request.query(query);

        return result;
    }catch(error){
        if(error.statusCode !== 409){
            console.error("Database error: ", error);
        }
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
    getAllBookmarks,
    createNewBookmark,
}