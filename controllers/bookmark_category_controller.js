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

// Funciton to get category by bookmark
async function getCategoriesByBookmarkID(req, res){
    try{
        const userID = req.user.userID;
        const bookmarkID = parseInt(req.params.bookmarkID);

        const categoryByBookmark = await bookmarkCategoryModel.getCategoriesByBookmarkID(userID, bookmarkID);
        return res.status(200).json(categoryByBookmark);
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error getting bookmarks by category"});
    }
}

// Function to assign bookmark to category
async function assignBookmarkToCategory(req, res){
    try{
        const userID = req.user.userID;
        const bookmarkID = parseInt(req.body.bookmarkID);
        const categoryID = parseInt(req.body.categoryID);

        const existing = await bookmarkCategoryModel.getBookmarkCategoryID(userID, bookmarkID, categoryID);
        if (existing){
            return res.status(409).json({message: "Bookmark already exists in this category."});
        }

        const assignSuccess = await bookmarkCategoryModel.assignBookmarkToCategory(userID, bookmarkID, categoryID);

        const BookmarkCategoryID = await bookmarkCategoryModel.getBookmarkCategoryID(userID, bookmarkID, categoryID);
        return res.status(201).json(BookmarkCategoryID);
    }catch(error){
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

        if (originalCategoryID == newCategoryID){
            return res.status(409).json({message: "No change in category."});
        }

        const bookmarkCategoryID = await bookmarkCategoryModel.getBookmarkCategoryID(userID, bookmarkID, originalCategoryID);
        await bookmarkCategoryModel.updateBookmarkCategory(bookmarkCategoryID, newCategoryID);
        return res.status(200).json({message: "Bookmark successfully updated to new category"});
    }catch(error){
        console.error("Controller error: ", error)
        res.status(500).json({error: "Error updating bookmark's new category"});
    }
}

// Function to delete bookmark from category
async function deleteBookmarkFromCategory(req, res){
    try{
        const userID = req.user.userID;
        const bookmarkID = req.body.bookmarkID;
        const categoryID = req.body.categoryID;

        const existing = await bookmarkCategoryModel.getBookmarkCategoryID(userID, bookmarkID, categoryID);
        if(!existing || existing.length == 0){
            return res.status(404).json({message: "Bookmark not found in this category"});
        }

        await bookmarkCategoryModel.deleteBookmarkFromCategory(userID, existing.bookmarkCategoryID);
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

            for (const bookmark of bookmarksInCategory){
                const bookmarkID = bookmark.bookmarkID;
                const categoryLinks = await bookmarkCategoryModel.countCategoriesForBookmark(userID, bookmarkID);

                if (categoryLinks > 1){
                    await bookmarkCategoryModel.detachAllBookmarksFromCategory(userID, categoryID);
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
    getCategoriesByBookmarkID,
    assignBookmarkToCategory,
    updateBookmarkCategory,
    deleteBookmarkFromCategory,
    deleteBookmarksInCategory,
}