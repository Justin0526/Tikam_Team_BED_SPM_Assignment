const {sql, poolPromise} = require("../bookmarkDbConfig");

// get all bookmarks of the user
async function getAllBookmarks(userID){
    let connection;
    try{
        connection = await poolPromise;
        const query = `SELECT b.*, c.categoryName FROM Bookmarks b 
                       LEFT JOIN BookmarkCategories bc ON b.bookmarkID = bc.bookmarkID
                       LEFT JOIN Categories c ON c.categoryID = bc.categoryID 
                       WHERE b.userID = @userID`;
        const request = connection.request();
        request.input("userID", userID);
        const result = await request.query(query);

        return result.recordset;
    }catch(error){
        console.error("Database error: ", error);
        throw error;
    }
}

// Get bookmark by place Id
async function getBookmarkByPlaceID(userID, placeID){
    let connection;
    try{
        connection = await poolPromise;
        const query = `SELECT * FROM Bookmarks WHERE userID = @userID AND placeID = @placeID`;
        const request = connection.request();
        request.input("userID", userID);
        request.input("placeID", placeID);
        const result = await request.query(query);

        return result.recordset;
    }catch(error){
        console.error("Database error: ", error)
        throw error;
    }
}

// Create new bookmark
async function createNewBookmark(userID, placeID){
    let connection;
    try{
        connection = await poolPromise;
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
    }
}

// Delete entire bookmark
async function deleteBookmark(userID, bookmarkID){
    try{
        connection = await poolPromise;
        const query = "DELETE FROM Bookmarks WHERE bookmarkID = @bookmarkID AND userID = @userID";
        const request = connection.request();
        request.input("bookmarkID", bookmarkID);
        request.input("userID", userID);
        const result = await request.query(query);

        return result.rowsAffected > 0;
    }catch(error){
        console.error("Database error: ", error);
        throw error;
    }
}

module.exports = {
    getAllBookmarks,
    getBookmarkByPlaceID,
    createNewBookmark,
    deleteBookmark,
}