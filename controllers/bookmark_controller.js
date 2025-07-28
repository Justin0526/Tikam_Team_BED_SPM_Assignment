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

// Function to getBookmarkByPlaceID 
async function getBookmarkByPlaceID(req, res){
    try{
        const userID = req.user.userID;
        const placeID = req.params.placeID;
        const bookmark = await bookmarkModel.getBookmarkByPlaceID(userID, placeID);
        
        if(bookmark && bookmark.length > 0){
            return res.status(200).json(bookmark);
        }else{
            return res.status(404).json({message: "Bookmark not found"});
        }
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error creating bookmark"});
    }
}

// Function to create bookmark
async function createBookmark(req, res){
    try{
        const userID = req.user.userID;
        const placeID = req.body.placeID;
        const placeName = req.body.placeName;

        const exists = await bookmarkModel.getBookmarkByPlaceID(userID, placeID);
        if(exists && exists.length > 0){
            return res.status(200).json(exists); // Already exists
        }

        await bookmarkModel.createNewBookmark(userID, placeID, placeName);
        const  newBookmark = await bookmarkModel.getBookmarkByPlaceID(userID, placeID);
        return res.status(201).json(newBookmark);
    }catch(error){
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

// Search bookmarks
async function searchBookmarks(req, res){
    const searchTerm = req.query.searchTerm;
    const userID = req.user.userID;

    if(!searchTerm){
        return res.status(400).json({message: "Search term is required"});
    }

    try{
        const bookmarks = await bookmarkModel.searchBookmarks(searchTerm, userID);
        return res.status(200).json(bookmarks);
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({message: "Error searching bookmarks"});
    }
}

module.exports = {
    getAllBookmarks,
    getBookmarkByPlaceID,
    createBookmark,
    deleteBookmark,
    searchBookmarks,
}