// Justin Tang Jia Ze S10269496B
const axios = require("axios");
const APIKEY = process.env.BROWSE_FACILITY_API_KEY;
const FieldMask = 'places.id,places.displayName,places.formattedAddress,places.photos,places.googleMapsLinks,places.currentOpeningHours,places.accessibilityOptions,nextPageToken';
const placeIdFieldMask = 'id,displayName,formattedAddress,googleMapsLinks,currentOpeningHours,accessibilityOptions,photos,types'
const browseFacilityURL = "https://places.googleapis.com/v1/places:searchText";
const placePhotoURL = "https://places.googleapis.com/v1"
const placeIdURL = "https://places.googleapis.com/v1/places";

// Function to get facilities searched by user
async function getFacilities(req, res){
    try{
        const { textQuery, pageToken, includedType } = req.body;

        const requestBody = pageToken
        // Check if page token exists, if it exists then body contains page token
            ?{
                textQuery: `${textQuery}, Singapore`,
                pageToken: `${pageToken}`,
                pageSize: 3
            }
        // If it doesn't then use the textQuery
            :{
                textQuery: `${textQuery}, Singapore`,
                pageSize: 3
            };

        if (includedType && includedType !== "null") {
            requestBody.includedType = includedType;
            }

        const response = await axios.post(
            browseFacilityURL,
            requestBody,
            {
                headers: {
                'X-Goog-Api-Key': APIKEY,
                'X-Goog-FieldMask': FieldMask
                }
            }
        );
        return res.json(response.data);
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving facilities from googleapis.com"});
    };
}

// Function to get the photo of the facility user searched
async function getPhoto(req, res) {
    try {
        const { photoName, maxHeightPx, maxWidthPx } = req.query;

        const url = `${placePhotoURL}/${photoName}/media?maxHeightPx=${maxHeightPx}&maxWidthPx=${maxWidthPx}&key=${APIKEY}`;

        const response = await axios.get(url, {
        responseType: 'arraybuffer',
        });

        // Set correct content type so browser knows it's an image
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data); // Send raw image bytes directly to frontend

    } catch (error) {
        console.error("Controller error: ", error.message || error);
        res.status(500).json({ error: "Error retrieving photos from googleapis.com" });
    }
}

// Get facilities by the placeID provided by google
async function getFacilitiesByPlaceID(req, res){
    try{
        const placeID = req.params.placeID;
        const url = `${placeIdURL}/${placeID}`;

        const response = await axios.get(url, {
            headers:{
                "X-Goog-Api-Key": APIKEY,
                "X-Goog-FieldMask": placeIdFieldMask
            }
        })

        return res.json(response.data);
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving place via placeID from googleapis.com"});
    }
}

module.exports = {
    getFacilities,
    getPhoto,
    getFacilitiesByPlaceID
}