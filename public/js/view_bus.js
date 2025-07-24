const apiBaseUrl = "http://localhost:3000";

window.addEventListener('load', async() =>{
    await getToken(token);
    const location = await getLocation();
    const nearbyBusStops = await getBusStops(location);
    const busStopCode = await getBusStopCode(nearbyBusStops);
})

// This function gets the user's current location (latitude and longitude)
// It returns a Promise so we can use async and await with it
function getLocation(){
    return new Promise((resolve) => {
        // Default to center of Singapore
        const defaultCoords = {latitude: 1.3521, longitude: 103.8198};

        // Check if the supports geolocation
        if(!navigator.geolocation){
            console.warn("Geolocation not supported. Using default location (Singapore).");
            return resolve(defaultCoords);
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                resolve({latitude, longitude});
            },
            (error) => {
                console.warn("Error getting location. Using default location (Singapore):", error.message);
                resolve(defaultCoords);
            }
        )
    });
};

async function getBusStops(location){
    console.log(location);
    const reqBody = {
        includedTypes: ["bus_station", "bus_stop"],
        maxResultCount: 20,
        rankPreference: "DISTANCE",
        locationRestriction: {
            circle: {
                center: location,
                radius: 5000
            }
        }
    }

    try{
        const response = await fetch(`${apiBaseUrl}/nearbyPublicTransport`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
                // "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(reqBody)
        });

        if(!response.ok){
            const errorBody = response.headers
              .get("content-type")
              ?.includes("application/json")
              ? await response.json()
              : {message: response.statusText};
            throw new Error(`HTTP Error! status ${response.status}, message: ${errorBody.message}`)
        }

        const data = await response.json();
        return data.places;
    }catch(error){
        console.error("Error fetching bus stops: ", error);
        alert("Failed to load bus stops");
    }
}

async function getBusStopCode(nearbyBusStops){
    let filteredBusStops = [];
    let skipAmount = 0;
    let remainingNearby = [...nearbyBusStops];
    // This duplicates the array, so we can modify remainingNearby safely by removing matched ones
    // without changing the original

    while(true){
        try{
            const response = await fetch(`${apiBaseUrl}/busStops?skip=${skipAmount}`, {
                method: 'GET',
                headers: {
                    "Accept": "application/json"
                    // "Authorization": `Bearer ${token}`
                }
            })

            if(!response.ok){
                const errorBody = response.headers
                  .get("content-type")
                  ?.includes("application/json")
                  ? await response.json()
                  : {message: response.statusText};
                throw new Error(`HTTP Error! status ${response.status}, message: ${errorBody.message}`)
            }

            // lta = land transport authority API
            const ltaBusStops = await response.json();
            if (ltaBusStops.length === 0) break; // End of LTA dataset

            // Try to match nearby stops with LTA descriptions
            for (let i = remainingNearby.length - 1; i >= 0; i--){
                const nearby = remainingNearby[i];
                const googleName = nearby.displayName.text.toLowerCase();

                for (let lta of ltaBusStops){
                    const ltaName = lta.Description.toLowerCase();
                    const ltaCode = lta.BusStopCode;

                    // Extract the code from the Google name if exists
                    const codeMatch = nearby.displayName.text.match(/\((\d{5})\)/);
                    // If codeMatch is not null, means that the regex found a match
                    // We then set googleCode to the first captured group 
                    // Example "(67401)".match(/\((\d{5})\)/) returns ["(67401)", "67401"]
                    // [0] is the full match and [1] will be the first capturing group
                    const googleCode = codeMatch ? codeMatch[1] : null

                    let matched = false;

                    // Match by BusStopCode
                    if (googleCode && googleCode === ltaCode) {
                        matched = true;
                    }

                    // Exact name match
                    else if (googleName === ltaName) {
                        matched = true;
                    }

                   // Loose token match with common words filtered out
                    else {
                        const bothOpp = googleName.startsWith("opp") && ltaName.startsWith("opp");
                        const bothNotOpp = !googleName.startsWith("opp") && !ltaName.startsWith("opp");

                        if (bothOpp || bothNotOpp) {
                            const NORMALIZATION_MAP = {
                                "int": "interchange",
                                "stn": "station",
                                "ave": "avenue",
                                "rd": "road",
                                "ctr": "centre",
                                "blk": "block"
                            };

                            const COMMON_WORDS = ["opp", "bus", "stop", "station", "stn", "int", "road", "rd", "ave", "blk"];

                            const normalizeToken = (token) => {
                                const cleaned = token.toLowerCase().replace(/[^a-z0-9]/gi, '');
                                return NORMALIZATION_MAP[cleaned] || cleaned;
                            };

                            const tokenize = (text) =>
                                text
                                    .split(/[\s/,-]+/)
                                    .map(normalizeToken)
                                    .filter(t => t && !COMMON_WORDS.includes(t));

                            const googleTokens = tokenize(googleName);
                            const ltaTokens = tokenize(ltaName);

                            const common = googleTokens.filter(token => ltaTokens.includes(token));
                            const matchRatio = common.length / Math.max(googleTokens.length, ltaTokens.length);

                            if (matchRatio >= 0.6 && common.length >= 2) {
                                matched = true;
                            }
                        }
                    }

                    if (matched) {
                        if (filteredBusStops.some(stop => stop.BusStopCode === lta.BusStopCode)) {
                            console.log("⚠️ Match found but already added:", lta.Description, lta.BusStopCode);
                        } else {
                            console.log("✅ New match:", nearby.displayName.text, "→", lta.Description);
                            filteredBusStops.push(lta);
                            remainingNearby.splice(i, 1);
                        }
                        break;
                    }
                }

            }

            // Stop if all nearby stops matched
            if (remainingNearby.length === 0) break;
            skipAmount += 500

        }catch(error){
            console.error("Error getting bus stop code");
            alert("Failed to get bus stop code");
            break;
        }
    }

    console.log(`✅ Matched Bus Stops with Codes: ${filteredBusStops.length}`, filteredBusStops);
    if (remainingNearby.length > 0) {
        console.warn("⚠️ Some nearby bus stops were not matched:", remainingNearby.map(s => s.displayName.text));
    }
    return filteredBusStops;
}

// async function getBusArrival(busStopCode){
//     try{
//         for (let i = 0; i  < busStopCode.length; i++ ){
//             const 
//         }
//     }
// }