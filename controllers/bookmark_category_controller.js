const bookmarkCategoryModel = require("../models/bookmark_category_model");
const bookmarkModel = require("../models/bookmark_model");
const categoryModel = require("../models/category_model");

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

        const allCategories = await categoryModel.getAllCategories(userID);
        // Check if categoryID exists in user's categories
        const categoryExists = allCategories.some(cat => cat.categoryID === categoryID);

        const allBoookmarks = await bookmarkModel.getAllBookmarks(userID);
        // Check if bookmarkID exists in user's bookmarks
        const bookmarkExists = allBoookmarks.some(bookmark => bookmark.bookmarkID === bookmarkID);

        if(!bookmarkExists || !categoryExists){
            return res.status(404).json({ error: "Bookmark or category not found for this user." });
        }

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

// Function to update bookmark's category
async function updateBookmarkCategory(req, res){
    try {
        const userID = req.user.userID;
        const bookmarkID = req.body.bookmarkID;
        const originalCategoryID = req.body.originalCategoryID;
        const newCategoryID = req.body.newCategoryID;

        const newBookmarkCategory = await bookmarkCategoryModel.updateBookmarkCategory(userID, bookmarkID, originalCategoryID, newCategoryID);
        return res.status(200).json({message: "Bookmark successfully updated to new category"});
    }catch(error){
        if(error.statusCode === 409){
            return res.status(409).json({error: error.message});
        } else if (error.statusCode === 404){
            return res.status(404).json({error: error.message});
        }
        res.status(500).json({error: "Error updating bookmark's new category"});
    }
}

// Function to delete bookmark from category
async function deleteBookmarkFromCategory(req, res){
    try{
        const userID = req.user.userID;
        const bookmarkID = req.body.bookmarkID;
        const categoryID = req.body.categoryID;

        const success = await bookmarkCategoryModel.deleteBookmarkFromCategory(userID, bookmarkID, categoryID);
        if(!success){
            return res.status(404).json({error: "Bookmark not found in category!"});
        }
        return res.status(200).json({message: "Bookmarks successfully deleted from category"});
    } catch(error){
        if(error.statusCode === 404){
            return res.status(404).json({error: error.message});
        }
        res.status(500).json({error: "Error deleting book from category"});
    }
}

// Function to delete all bookmarks in a category
async function deleteBookmarksInCategory(req, res){
    try{
        const userID = req.user.userID;
        const categoryID = req.body.categoryID;
        const alsoDeleteBookmarks = req.body.alsoDeleteBookmarks;

        if (alsoDeleteBookmarks){
            const bookmarksInCategory = await bookmarkCategoryModel.getBookmarksByCategory(userID, categoryID);

            console.log(bookmarksInCategory);
            for (const bookmark of bookmarksInCategory){
                const bookmarkID = bookmark.bookmarkID;
                const categoryLinks = await bookmarkCategoryModel.countCategoriesForBookmark(userID, bookmarkID);

                if (categoryLinks > 1){
                    await bookmarkCategoryModel.deleteBookmarkFromCategory(userID, bookmarkID, categoryID);
                } else{
                    await bookmarkModel.deleteBookmark(userID, bookmarkID);
                }
            }

            await categoryModel.deleteCategory(userID, categoryID);
            return res.status(200).json({message: "Category and bookmarks deleted successfully"});
        }else{
            const success = await bookmarkCategoryModel.detachAllBookmarksFromCategory(userID, categoryID);
            if(!success){
                return res.status(404).json({error: "No bookmarks were associated with this category"});
            }
            await categoryModel.deleteCategory(userID, categoryID);
            return res.status(200).json({message: "Category deleted successfully"});
        }
    }catch(error){
        console.error("controller error: ", error);
        res.status(500).json({error: "Failed to delete category"});
    }
}
module.exports = {
    getBookmarksByCategory,
    assignBookmarkToCategory,
    updateBookmarkCategory,
    deleteBookmarkFromCategory,
    deleteBookmarksInCategory,
}