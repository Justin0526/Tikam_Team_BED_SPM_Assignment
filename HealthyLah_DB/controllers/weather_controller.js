const axios = require("axios");
const APIKEY = "131918acf1dc4bcfb3f53822251806";
const location = "Singapore";

async function getWeather(req,res){
    try{
        const response = await axios.get("http://api.weatherapi.com/v1/forecast.json", {
            params: {
                key: APIKEY,
                q: location,
                days: 7
            }
        });
        res.json(response.data);
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving weather data from weatherapi.com"});
    };
}

module.exports = {
    getWeather,
}