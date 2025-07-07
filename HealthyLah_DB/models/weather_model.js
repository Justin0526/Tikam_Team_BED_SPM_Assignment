const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getOutfitTypeID(condition){
    let connection; 
    try{
        connection = await sql.connect(dbConfig);
        const query = `SELECT outfitTypeID FROM OutfitRule WHERE 
                        weatherCondition = @condition`;
        const request = connection.request();
        request.input("condition", condition);
        const result = await request.query(query);

        if (result.recordset.length === 0 ){
            return null; // OutfitTypeID not found
        }
        return result.recordset[0].outfitTypeID;
    }catch(error){
        console.error("Database error: ", error);
        throw error;
    }finally{
        if (connection){
            try{
                await connection.close();
            } catch(closeError){
                console.error("Error closing connection: ", closeError);
            }
        }
    }
}

async function getSuggestedOutfit(outfitTypeID){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `SELECT * FROM SuggestedOutfit WHERE outfitTypeID = @outfitTypeID`;
        const request = connection.request();
        request.input("outfitTypeID", outfitTypeID);
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
                console.log("Error closng connection: ", closeError);
            }
        }
    }
}

module.exports = {
    getSuggestedOutfit,
    getOutfitTypeID,
}