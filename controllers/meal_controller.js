const mealModel = require("../models/meal_model");
const { fetchCalories } = require("../models/calorie_service");

//Get Meals By UserID and Meal Date
async function getMealsByUserIDAndMealDate(req, res){
    const userID = req.user.userID;
    const mealDate = req.query.mealDate || new Date().toISOString().split('T')[0]; // Use query if available
    try {
        const meals = await mealModel.getMealsByUserIDAndMealDate(userID, mealDate);
        if (!meals || meals.length === 0) {
            return res.status(200).json([]); // Return empty array if no meals found
        }
        res.json(meals);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving meals" });
    }
}

//Create Meal Log
async function createMealLog(req, res){
  console.log("Incoming meal:");
  try {
    const { foodItem, timeFrame, mealDate, manualCalories } = req.body;
    const userID = req.user.userID;

    let calories = await fetchCalories(foodItem);

    if (!calories) {
      if (typeof manualCalories === "string" && manualCalories.toLowerCase() === "unknown") {
        calories = null;
      } 
      else if (manualCalories) {
        const parsed = parseInt(manualCalories);
        if (isNaN(parsed)) {
          return res.status(400).json({ message: "Invalid calorie input" });
        }
        if (parsed < 0) {
          return res.status(400).json({ message: "Calories cannot be negative" });
        }
        calories = parsed;
      } 
      else {
        // No manual input provided yet → return instruction to frontend 
        return res.status(200).json({
          message: "Calorie data not found. Please enter manually.",
          requiresManual: true // this value is sent to front-end and it leads to showing manual input placeholder
        });
      }
    }

    const meal = { foodItem, timeFrame, mealDate, calories, userID };
    await mealModel.createMealLog(meal);

    res.status(201).json({ message: "Meal created successfully" });

  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Failed to add meal" });
  }
}

//Update Meal logs by Meal ID
async function updateMealLogByMealID(req, res) {
  try {
    const mealID = parseInt(req.params.mealID);
    const userID = req.user.userID;
    const { foodItem, timeFrame, mealDate, manualCalories } = req.body;

    let calories = null;
    // Case 1: User input manual calorie
    if (manualCalories !== undefined && manualCalories !== null) {
      if (manualCalories === "unknown" || manualCalories.toString().toLowerCase() === "unknown") {
        calories = null;
      } 
      else {
        const parsed = parseInt(manualCalories);
        if (isNaN(parsed)) {
          return res.status(400).json({ error: "Invalid calorie input." });
        }
        if (parsed < 0) {
          return res.status(400).json({ error: "Calories cannot be negative." });
        }
        calories = parsed;
      }
    }

    // Case 2: User left it empty → try to fetch from OpenFoodFacts
    else {
      const fetched = await fetchCalories(foodItem);
      console.log("fetched", fetched);//test
      if (fetched > 0) {
        calories = fetched;
      } 
      else {
        return res.status(200).json({
          message: "No calorie data found. Please enter manually.",
          requiresManual: true
        });
      }
    }
    const updatedMealData = {
      foodItem,
      timeFrame,
      mealDate,
      calories
    };

    const success = await mealModel.updateMealLogByMealID(mealID, userID, updatedMealData);
    if (!success) {
      return res.status(404).json({ error: "Meal not found" });
    }

    const updatedMeals = await mealModel.getMealsByUserIDAndMealDate(userID, mealDate);
    res.json({
      message: `Meal with ID ${mealID} updated successfully`,
      meal: updatedMeals,
    });

  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error updating meal" });
  }
}

//delete meal
async function deleteMealLogByMealID(req, res) {
    try{
        const mealID = parseInt(req.params.mealID);
        const userID = req.user.userID;
        const deleted = await mealModel.deleteMealLogByMealID(mealID, userID);

        if(!deleted){
            return res.status(404).json({error: "Meal not found or already deleted"});
        }

        res.json({message: "Meal deleted successfully"});
    }
    catch(error){
        console.error("Controller error:", error);
        res.status(500).json({error: "Error deleting Meal"});
    } 
}

module.exports = {
    getMealsByUserIDAndMealDate,
    createMealLog,
    updateMealLogByMealID,
    deleteMealLogByMealID,
};