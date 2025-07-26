const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get user's bookmark according to category
async function getBookmarksByCategory(userID, categoryID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `SELECT c.categoryName, b.placeID, b.bookmarkedAt, bc.createdAt
                       FROM BookmarkCategories bc
                       INNER JOIN Categories c ON bc.categoryID = c.categoryID
                       INNER JOIN Bookmarks b ON bc.bookmarkID = b.bookmarkID
                       WHERE bc.userID = @userID AND bc.categoryID = @categoryID`;
        const request = connection.request();
        request.input("userID", userID);
        request.input("categoryID", categoryID);
        const result = await request.query(query);
        
        return result.recordset;
    }catch(error){
        console.error("Database error: ", error);
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

// Assign bookmark to a category;
async function assignBookmarkToCategory(userID, bookmarkID, categoryID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `INSERT INTO BookmarkCategories (userID, bookmarkID, categoryID) VALUES (@userID, @bookmarkID, @categoryID)`;
        const request = connection.request();
        request.input("userID", userID);
        request.input("bookmarkID", bookmarkID);
        request.input("categoryID", categoryID);
        const result = await request.query(query);

        return result;
    }catch(error){
        if (error.number === 2627){
            const errorPK = new Error("Bookmark is already in this category");
            errorPK.statusCode = 409; // conflict
            throw errorPK;
        }
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
    getBookmarksByCategory,
    assignBookmarkToCategory,
}