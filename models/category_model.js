// Justin Tang Jia Ze S10269496B
const sql = require ("mssql");
const dbConfig = require("../dbConfig");

// get all categories of the user
async function getAllCategories(userID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `SELECT * FROM Categories WHERE userID = @userID`;
        const request = connection.request();
        request.input("userID", userID);
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

// Get category by name 
async function getCategoryByName(userID, categoryName){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `SELECT * FROM Categories WHERE userID = @userID AND categoryName = @categoryName`;
        const request = connection.request();
        request.input("userID", userID);
        request.input("categoryName", categoryName);
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
                console.error("Error closing database connection: ", closeError);
            }
        }
    }
}

// Create new category for user
async function createCategory(userID, categoryName){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `INSERT INTO Categories (userID, categoryName) VALUES (@userID, @categoryName);`
        const request = connection.request();
        request.input("userID", userID);
        request.input("categoryName", categoryName);
        const result = await request.query(query);

        return result;
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

// Function for user to edit category name by category ID
async function updateCategoryName(userID, categoryName, categoryID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = "UPDATE Categories SET categoryName = @categoryName WHERE userID = @userID AND categoryID = @categoryID";
        const request = connection.request();
        request.input("categoryName", categoryName);
        request.input("categoryID", categoryID)
        request.input("userID", userID);
        const result = await request.query(query);

        return result.rowsAffected > 0; // Indicate success based on affected rows
    }catch(error){
        console.error("Database error: ", error);
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

// Delete category by categoryID
async function deleteCategory(userID, categoryID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = "DELETE FROM Categories WHERE categoryID = @categoryID AND userID = @userID";
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

module.exports = {
    getAllCategories,
    getCategoryByName,
    createCategory,
    updateCategoryName,
    deleteCategory,
}
