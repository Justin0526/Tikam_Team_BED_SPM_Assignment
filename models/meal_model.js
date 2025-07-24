const sql = require("mssql");
const dbConfig = require("../dbConfig");
const { fetchCalories } = require("../models/calorie_service");


//Get All Meals by UserId and mealDate
async function getMealsByUserIDAndMealDate(userID, mealDate) {
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT 
                *
            FROM MealLogs
            WHERE userID = @userID AND mealDate = @mealDate
            ORDER BY
            CASE timeFrame
                WHEN 'early morning' THEN 1
                WHEN 'morning' THEN 2
                WHEN 'midday' THEN 3
                WHEN 'afternoon' THEN 4
                WHEN 'evening' THEN 5
                WHEN 'night' THEN 6
                ELSE 7
            END

        `;
        const request = connection.request();
        request.input("userID", sql.Int, userID);
        request.input("mealDate", mealDate);
        const result = await request.query(query);

        if(result.recordset.length === 0){
            return null;
        }

        //Format date form properly
        return result.recordset.map(row => ({
            ...row,
            mealDate: row.mealDate?.toISOString().split('T')[0],
        }));

    }
    catch(error){
        console.error("Database error:", error);
        throw error;
    }
    finally{
        if(connection){
            try{
                await connection.close();
            }
            catch(error){
                console.error("Error closing connection:", error);
            }
        }
    }
}

// //Create meal log
// async function createMealLog(meal){
//     let connection;
//     //create sample carlories for each specific meal

//     try{
//         connection = await sql.connect(dbConfig);
//         const query = 
//         `INSERT INTO MealLogs
//         (userID, foodItem, timeFrame, calories, mealDate)
//         VALUES (@userID, @foodItem, @timeFrame, @calories, @mealDate);
//         `;

//         // // //input mealDate as today's date if not provided
//         // // const mealDate = meal.mealDate ? meal.mealDate : new Date().toISOString().split('T')[0];
//         const mealCalories = await fetchCalories(meal.foodItem); // Fetch calories from external service
        
//         const finalMealCalories = mealCalories || 0;// If calories are not found, default to 0, 
//         // If calories are not found, default to 0, I will let the user input calories if not found( not implemented yet    )


//         const request = connection.request();
//         request.input("userID", sql.Int, meal.userID);
//         request.input("foodItem", sql.VarChar, meal.foodItem);
//         request.input("timeFrame", sql.VarChar, meal.timeFrame);
//         request.input("calories", sql.Int, finalMealCalories);
//         request.input("mealDate", meal.mealDate);

//         await request.query(query);
//         return{message: "Meal created successfully"};

//     }
//     catch(error){
//         console.error("Database error:", error);
//         throw error;
//     }
//     finally{
//         if(connection){
//             try{
//                 await connection.close();
//             }
//             catch(error){
//                 console.error("Error closing connection:", err);
//             }
//         }
//     }
// }

//Create meal log
async function createMealLog(meal){
    let connection;
    //create sample carlories for each specific meal

    try{
        connection = await sql.connect(dbConfig);
        const query = 
        `INSERT INTO MealLogs
        (userID, foodItem, timeFrame, calories, mealDate)
        VALUES (@userID, @foodItem, @timeFrame, @calories, @mealDate);
        `;

        // // // //input mealDate as today's date if not provided
        // // // const mealDate = meal.mealDate ? meal.mealDate : new Date().toISOString().split('T')[0];
        // const mealCalories = await fetchCalories(meal.foodItem); // Fetch calories from external service
        
        // const finalMealCalories = mealCalories || 0;// If calories are not found, default to 0, 
        // // If calories are not found, default to 0, I will let the user input calories if not found( not implemented yet    )


        const request = connection.request();
        request.input("userID", sql.Int, meal.userID);
        request.input("foodItem", sql.VarChar, meal.foodItem);
        request.input("timeFrame", sql.VarChar, meal.timeFrame);
        if (meal.calories === null || meal.calories === undefined) {
            request.input("calories", sql.Int, null); // explicitly say it's null
        } else {
            request.input("calories", sql.Int, meal.calories);
        }

        request.input("mealDate", meal.mealDate);

        await request.query(query);
        return{message: "Meal created successfully"};

    }
    catch(error){
        console.error("Database error:", error);
        throw error;
    }
    finally{
        if(connection){
            try{
                await connection.close();
            }
            catch(error){
                console.error("Error closing connection:", err);
            }
        }
    }
}
//Update Meal log By mealID
// async function updateMealLogByMealID(mealID, userID, meal) {
//   let connection;
//   try {
//     connection = await sql.connect(dbConfig);
//     const query =
//       `UPDATE MealLogs
//       SET foodItem = @foodItem,
//       timeFrame = @timeFrame,
//       calories = @calories,
//       mealDate = @mealDate
//       WHERE mealID = @mealID AND userID = @userID
//       `;

//     // const mealCalories = await fetchCalories(meal.foodItem); // Fetch calories from external service
//     // const finalMealCalories = mealCalories || 0; // If calories are not found, default to 0,
//     // // If calories are not found, default to 0, I will let the user input calories if not found( not implemented yet    )

//     // const finalMealCalories = (meal.calories && meal.calories > 0) ? meal.calories:null;
//     if (finalMealCalories === null) {
//         request.input("calories", sql.Int, null);
//     } 
//     else {
//         request.input("calories", sql.Int, finalMealCalories);
//     }

//     const request = connection.request();
//     request.input("mealID", sql.Int, mealID);
//     request.input("userID", sql.Int, userID);
//     request.input("foodItem", sql.VarChar, meal.foodItem);
//     request.input("timeFrame", sql.VarChar, meal.timeFrame);
//     request.input("calories", sql.Int, finalMealCalories);
//     request.input("mealDate", meal.mealDate);

//     const result = await request.query(query);
//     return result.rowsAffected[0] > 0;
//   }
//   catch(error){
//     console.error("Database error:", error);
//     throw error;
//   }finally{
//     if(connection){
//       try{
//         await connection.close();
//       }catch(err){
//         console.error("Error closing connection:", err);
//       }
//     }
//   }
// }

async function updateMealLogByMealID(mealID, userID, meal) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const query = `
      UPDATE MealLogs
      SET foodItem = @foodItem,
          timeFrame = @timeFrame,
          calories = @calories,
          mealDate = @mealDate
      WHERE mealID = @mealID AND userID = @userID
    `;

    // ✅ Define finalMealCalories safely
    const finalMealCalories = (meal.calories != null && !isNaN(meal.calories)) ? meal.calories : null;

    const request = connection.request();
    request.input("mealID", sql.Int, mealID);
    request.input("userID", sql.Int, userID);
    request.input("foodItem", sql.VarChar, meal.foodItem);
    request.input("timeFrame", sql.VarChar, meal.timeFrame);
    request.input("mealDate", meal.mealDate);

    // ✅ Now safely pass calories (can be null)
    request.input("calories", sql.Int, finalMealCalories);

    const result = await request.query(query);
    return result.rowsAffected[0] > 0;

  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

//Delete Meal
async function deleteMealLogByMealID(mealID, userID) {
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `
            DELETE FROM MealLogs WHERE mealID = @mealID AND userID = @userID;
        `;
        const request = connection.request();
        request.input("mealID", sql.Int, mealID);
        request.input("userID", sql.Int, userID);
        const result = await request.query(query);
        if(result.rowsAffected[0] === 0){
            return false;
        }
        return true;
    }
    catch(error){
        console.error("Database error:", error);
        throw error;
    }
    finally{
        if(connection){
            try{
                await connection.close();
            }
            catch(error){
                console.error("Error closing connection:",error);
            }
        }
    }
}

module.exports = {
    getMealsByUserIDAndMealDate,
    createMealLog,
    updateMealLogByMealID,
    deleteMealLogByMealID,
};