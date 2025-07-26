const categorymodel = require("../models/category_model");

// Function to get all the user's category
async function getAllCategories(req, res){
    try{
        const userID = req.user.userID;
        const categories = await categorymodel.getAllCategories(userID);

        return res.status(200).json(categories);
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving all categories"})
    }
}

// Function to create new category
async function createCategory(req, res){
    try{
        const userID = req.user.userID;
        const categoryName = req.body.categoryName;

        const newCategory = await categorymodel.createCategory(userID, categoryName);
        return res.status(201).json(newCategory);
    }catch(error){
        if (error.statusCode === 409){
            return res.status(409).json({error: error.message});
        }
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error creating category"})
    }
}

// Function for user to update category name
async function updateCategoryName(req, res){
    try{
        const userID = req.user.userID;
        const categoryName = req.body.categoryName;
        const categoryID = req.body.categoryID;

        const newCategoryName = await categorymodel.updateCategoryName(userID, categoryName, categoryID);

        return res.status(200).json({message: `Category successfully updated`})
    }catch(error){
        if (error.statusCode === 409){
            return res.status(409).json({error: error.message});
        }
        res.status(500).json({error: "Error updating category name"});
    }
}


module.exports = {
    getAllCategories,
    createCategory,
    updateCategoryName,
}