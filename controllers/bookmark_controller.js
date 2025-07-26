const bookmarkModel = require("../models/bookmark_model");

// Function to get the all the bookmarks for the user
async function getAllBookmarks(req, res){
    try{
        const userID = req.user.userID;
        const bookmarks = await bookmarkModel.getAllBookmarks(userID);

        return res.status(200).json(bookmarks);
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving bookmarks"});
    }
}

// Function to create bookmark
async function createBookmark(req, res){
    try{
        const userID = req.user.userID;
        const placeID = req.body.placeID;

        const newBookmark = await bookmarkModel.createNewBookmark(userID, placeID);
        return res.status(201).json(newBookmark);
    }catch(error){
        if (error.statusCode === 409){
            return res.status(409).json({error: error.message});
        }
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error creating bookmark"});
    }
}

// Function to delete bookmark
async function deleteBookmark(req, res){
    try{
        const userID = req.user.userID;
        const bookmarkID = req.body.bookmarkID;

        const success = await bookmarkModel.deleteBookmark(userID, bookmarkID);
        if(!success){
            return res.status(404).json({error: "Bookmark not found!"});
        }
        return res.status(200).json({message: "Bookmark successfully deleted"});
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error deleting bookmark"});
    }
}

module.exports = {
    getAllBookmarks,
    createBookmark,
    deleteBookmark,
}