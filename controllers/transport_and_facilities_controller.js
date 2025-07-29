const axios = require("axios");
const APIKEY = process.env.BROWSE_FACILITY_API_KEY;
const FieldMask = `places.id,places.displayName,places.formattedAddress,places.googleMapsLinks,places.currentOpeningHours,places.primaryType`;
const nearbyFacilityURL = "https://places.googleapis.com/v1/places:searchNearby";

async function getFacilities(req, res){
    try{
        const {includedTypes, maxResultCount, locationRestriction} = req.body;

        const requestBody = {
            includedTypes: includedTypes,  
            locationRestriction: locationRestriction
        }

        const response = await axios.post(
            nearbyFacilityURL,
            requestBody,
            {
                headers: {
                    'X-Goog-Api-Key': APIKEY,
                    'X-Goog-FieldMask': FieldMask
                }
            }
        );

        const filteredPlaces = [];
        const allPlaces = response.data.places;

        for (const facility of allPlaces){
            const placeName = facility.displayName.text.toLowerCase();
            if(placeName.includes("mrt") || placeName.includes("bus") || placeName.includes("lrt")) {
                continue;
            }
            filteredPlaces.push(facility);
            if (filteredPlaces.length >= maxResultCount){
                break;
            }
        }

        return res.status(200).json({places: filteredPlaces});
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving facilities from googleapis.com"});
    };
}

async function getpublicTransport(req, res){
    try{
        const {includedTypes, maxResultCount, rankPreference, locationRestriction} = req.body;

        const requestBody = {
            includedTypes: includedTypes,
            maxResultCount: maxResultCount,
            rankPreference: rankPreference,
            locationRestriction: locationRestriction
        }

        const response = await axios.post(
            nearbyFacilityURL,
            requestBody,
            {
                headers: {
                    'X-Goog-Api-Key': APIKEY,
                    'X-Goog-FieldMask': FieldMask
                }
            }
        );
        return res.status(200).json(response.data);
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving facilities from googleapis.com"});
    }
}

module.exports = {
    getFacilities,
    getpublicTransport
}