const bookmarkCategoryModel = require("../models/bookmark_category_model");

// Function to get user's bookmarks by category
async function getBookmarksByCategory(req, res){
    try{
        const userID = req.user.userID;
        const categoryID = parseInt(req.params.categoryID);
        const bookmarksByCategory = await bookmarkCategoryModel.getBookmarksByCategory(userID, categoryID);

        return res.status(200).json(bookmarksByCategory);
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error getting bookmarks by category"});
    }
}

// Function to assign bookmark to category
async function assignBookmarkToCategory(req, res){
    try{
        const userID = req.user.userID;
        const bookmarkID = req.body.bookmarkID;
        const categoryID = req.body.categoryID;

        const assignSuccess = await bookmarkCategoryModel.assignBookmarkToCategory(userID, bookmarkID, categoryID);
        return res.status(201).json(assignSuccess);
    }catch(error){
        if (error.statusCode === 409){
            return res.status(409).json({error: error.message});
        }
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error assigining bookmark to category"});
    }
}

module.exports = {
    getBookmarksByCategory,
    assignBookmarkToCategory,
}