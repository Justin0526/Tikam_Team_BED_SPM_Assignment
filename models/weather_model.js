// Justin Tang Jia Ze S10269496B
const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getSuggestedOutfit(condition){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `SELECT TOP 2 * 
                        FROM SuggestedOutfit 
                        WHERE outfitTypeID IN (
                            SELECT outfitTypeID 
                            FROM OutfitRule 
                            WHERE weatherCondition = @condition
                        )
                        ORDER BY NEWID();
                        `
                    // NEWID() generates a unique random value per row
                    // ORDER BY NEWID() shuffles the rows
                    // TOP 1 then picks one randomly
        const request = connection.request();
        request.input("condition", condition);
        const result = await request.query(query);

        if (result.recordset.length === 0){
            return null // Outfit not found
        }
        return result.recordset;
    }catch(error){
        console.error("Database error: ", error);
        throw error;
    }finally{
        if (connection){
            try{
                await connection.close();
            }catch(closeError){
                console.error("Error closng connection: ", closeError);
            }
        }
    }
}

// Favourite an outfit
async function createFavouriteOutfit(outfitID, userID, weatherCondition){
    let connection;
    try{
        connection = await sql.connect(dbConfig);

        const checkQuery = `SELECT * FROM FavouriteOutfit WHERE outfitID = @outfitID AND userID = @userID`;
        const checkRequest = connection.request();
        checkRequest.input("outfitID", outfitID);
        checkRequest.input("userID", userID);
        const checkResult = await checkRequest.query(checkQuery);

        if(checkResult.recordset.length > 0){
            return {
                message: "This outfit is already favourited" ,
                alreadyExists: true
            };
        };

        const query = `INSERT INTO FavouriteOutfit (outfitID, userID, weatherCondition) VALUES (@outfitID, @userID, @weatherCondition);`
        const request = connection.request();
        request.input("outfitID", outfitID);
        request.input("userID", userID);
        request.input("weatherCondition", weatherCondition);
        const result = await request.query(query);

        return result;
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
    getSuggestedOutfit,
    createFavouriteOutfit,
}