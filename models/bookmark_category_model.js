const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get user's bookmark according to category
async function getBookmarksByCategory(userID, categoryID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `SELECT c.categoryName,b.bookmarkID, b.placeID, b.bookmarkedAt, bc.createdAt
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

// Get bookmarkCategoryID to check if it the bookmark exists in the category
async function getBookmarkCategoryID(userID, bookmarkID, categoryID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT *
            FROM BookmarkCategories
            WHERE userID = @userID AND bookmarkID = @bookmarkID AND categoryID = @categoryID;
        `;

        const request = connection.request();
        request.input("userID", userID);
        request.input("bookmarkID", bookmarkID);
        request.input("categoryID", categoryID);
        const result = await request.query(query);

        if(result.recordset.length > 0){
            return result.recordset[0];
        }

        return null;
    }catch(error){
        console.error("Database error: ", error);
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

// Assign bookmark to a category
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

// Function to update bookmark's category
async function updateBookmarkCategory(bookmarkCategoryID, newCategoryID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `UPDATE BookmarkCategories SET categoryID = @categoryID WHERE bookmarkCategoryID = @bookmarkCategoryID`;
        const request = connection.request();
        request.input("categoryID", newCategoryID);
        request.input("bookmarkCategoryID", bookmarkCategoryID);
        const result = await request.query(query);

        return result.rowsAffected > 0;
    }catch(error){
        if(error.statusCode !== 409 && error.statusCode !== 404){
            console.error("Database error: ", error);
        }
        throw error;
    }finally{
        if(connection){
            try{
                await connection.close();
            }
            catch(closeError){
                console.error("Error closing connection: ", closeError);
            }
        }
    }
}

// Function to delete bookmark from category
async function deleteBookmarkFromCategory(bookmarkCategoryID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = "DELETE FROM BookmarkCategories WHERE bookmarkCategoryID = @bookmarkCategoryID";
        const request = connection.request();
        request.input("bookmarkCategoryID", bookmarkCategoryID);
        const result = await request.query(query);

        return result.rowsAffected > 0;
    }catch(error){
        if(error.statusCode !== 404){
            console.error("Database error: ", error);
        }
        throw error;
    }finally{
        if(connection){
            try{
                await connection.close();
            }
            catch(closeError){
                console.error("Error closing connection: ", closeError);
            }
        }
    }
}

// Function to delete bookmarks in a category when a category is deleted of a user
async function detachAllBookmarksFromCategory(userID, categoryID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = "DELETE FROM BookmarkCategories WHERE categoryID = @categoryID AND userID = @userID";
        const request = connection.request();
        request.input("categoryID", categoryID);
        request.input("userID", userID);
        const result = await request.query(query);

        return result.rowsAffected > 0;
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

// Function to count the categories the bookmark belongs to
async function countCategoriesForBookmark(userID, bookmarkID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `SELECT COUNT(*) AS count FROM BookmarkCategories WHERE userID = @userID AND bookmarkID = @bookmarkID;`;
        const request = connection.request();
        request.input("userID", userID);
        request.input("bookmarkID", bookmarkID);
        const result = await request.query(query)

        return result.recordset[0].count;
    }catch(error){
        console.error("Database error: ", error);
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
module.exports = {
    getBookmarksByCategory,
    getBookmarkCategoryID,
    assignBookmarkToCategory,
    updateBookmarkCategory,
    deleteBookmarkFromCategory,
    detachAllBookmarksFromCategory,
    countCategoriesForBookmark,
}