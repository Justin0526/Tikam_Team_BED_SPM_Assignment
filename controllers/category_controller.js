const categoryModel = require("../models/category_model");

// Function to get all the user's category
async function getAllCategories(req, res){
    try{
        const userID = req.user.userID;
        const categories = await categoryModel.getAllCategories(userID);

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

        const existing = await categoryModel.getCategoryByName(userID, categoryName);
        if(existing && existing.length > 0){
            return res.status(409).json({error: "Category already exists", category: existing})
        }

        await categoryModel.createCategory(userID, categoryName);
        const newCategory = await categoryModel.getCategoryByName(userID, categoryName)
        return res.status(201).json({category: newCategory[0]});
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error creating category"})
    }
}

// Function for user to update category name
async function updateCategoryName(req, res){
    try{
        const userID = req.user.userID;
        let newCategoryName = req.body.newCategoryName;
        const categoryID = req.body.categoryID;

        const existing = await categoryModel.getCategoryByName(userID, newCategoryName);
        if (existing.length > 0) {
            return res.status(409).json({ error: "Another category with this name already exists" });
        }

        const success = await categoryModel.updateCategoryName(userID, newCategoryName, categoryID);
        if (!success) {
            return res.status(404).json({ error: "Category not found or no change" });
        }

        newCategoryName = await categoryModel.getCategoryByName(userID, newCategoryName);
        console.log(newCategoryName);
        return res.status(200).json(newCategoryName);

    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error updating category name"});
    }
}

// Function to delete category by categoryID
async function deleteCategory(req, res){
    try{
        const userID = req.user.userID;
        const categoryID = req.body.categoryID;

        const success = await categoryModel.deleteCategory(userID, categoryID);
        if (!success){
            return res.status(404).json({error: "Category not found!"});
        }
        return res.status(200).json({error: "Category successfully deleted"});
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error deleting category"});
    }
}

module.exports = {
    getAllCategories,
    createCategory,
    updateCategoryName,
    deleteCategory,
}