// Justin Tang Jia Ze S10269496B
const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Function to get favourite outfit via the userID
async function getFavouriteOutfit(userID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `SELECT 
                            so.outfitID, 
                            so.outfitName, 
                            so.outfitImageURL, 
                            so.outfitGender,
                            so.outfitDesc,
                            so.outfitTypeID,
                            fo.favouriteOutfitID,
                            fo.userID,
                            fo.favouriteDateTime,
                            fo.weatherCondition
                        FROM SuggestedOutfit so
                        INNER JOIN FavouriteOutfit fo
                        ON so.outfitID = fo.outfitID
                        WHERE fo.userID = @userID;
                        `;
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

// Function to delete favourited outfit the user choose, delete via favouriteOutfitID
async function deleteFavouriteOutfit(favouriteOutfitID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `DELETE FROM FavouriteOutfit WHERE favouriteOutfitID = @favouriteOutfitID`;
        const request = connection.request();
        request.input("favouriteOutfitID", favouriteOutfitID);
        const result = await request.query(query);

        return result.rowsAffected > 0;
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

module.exports = {
    getFavouriteOutfit,
    deleteFavouriteOutfit,
}