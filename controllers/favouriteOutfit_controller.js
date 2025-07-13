const outfitModel = require("../models/favouriteOutfit_model");

async function getFavouriteOutfit(req, res){
    try{
        const userID = req.user.userID; 
        const outfits = await outfitModel.getFavouriteOutfit(userID);

        return res.status(200).json(outfits);
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving favourite outfits"});
    }
}

async function deleteFavouriteOutfit(req, res){
    try{
        const favouriteOutfitID = parseInt(req.params.favouriteOutfitID);
        const success = await outfitModel.deleteFavouriteOutfit(favouriteOutfitID);

        if(!success){
            return res.status(404).json({error: "Outfit not found!"});
        }
        return res.status(200).json({message: "Outfit deleted successfully"});
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error deleting the outfit"});
    }
}

module.exports = {
    getFavouriteOutfit,
    deleteFavouriteOutfit,
}