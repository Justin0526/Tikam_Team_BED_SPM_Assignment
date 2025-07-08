const axios = require("axios");
const APIKEY = process.env.WEATHER_API_KEY;
const location = "Singapore";
const weatherModel = require("../models/weather_model")

async function getWeather(req,res){
    try{
        const response = await axios.get("http://api.weatherapi.com/v1/forecast.json", {
            params: {
                key: APIKEY,
                q: location,
                days: 7
            }
        });
        const condition = response.data.current.condition.text;
        const outfitTypeID = await weatherModel.getOutfitTypeID(condition);
        const outfit = await weatherModel.getSuggestedOutfit(outfitTypeID);

        if(!outfit){
            res.status(404).json({error: "Outfit not found"});
        }

        res.json({
                weather: response.data,
                outfit: outfit,
        });


    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving weather data from weatherapi.com or outfit"});
    };
}

// async function favouriteOutfit(req, res){
//     try{
//         // Get userID
//         // Get outfitID
//     }
// }

module.exports = {
    getWeather,
}