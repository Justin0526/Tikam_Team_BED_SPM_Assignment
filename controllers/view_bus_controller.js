const axios = require("axios");
const APIKEY = process.env.BUS_API_KEY;

const busStopsURL = "https://datamall2.mytransport.sg/ltaodataservice/BusStops";
const busArrivalURL = "https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival";

async function getBusStops(req, res){
    try{
        const skipAmount = req.query.skip || 0;

        const response = await axios.get(`${busStopsURL}?$skip=${skipAmount}`,{
            headers: {
                AccountKey: APIKEY,
            }
        })

        return res.status(200).json(response.data.value)
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving bus stops from LTA API"});
    }
}

async function getBusArrival(req, res){
    try{
        const busStopCode = req.query.busStopCode;

        const response = await axios.get(`${busArrivalURL}?BusStopCode=${busStopCode}`, {
            headers: {
                AccountKey: APIKEY
            }
        });

        return res.status(200).json(response.data);
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving bus arrivals from LTA API"});
    };
}

module.exports = {
    getBusStops,
    getBusArrival,
}