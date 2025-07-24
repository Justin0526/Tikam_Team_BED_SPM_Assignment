const apiBaseUrl = "http://localhost:3000";

window.addEventListener('load', async() =>{
    await getToken(token);
    const location = await getLocation();
    const nearbyBusStops = await getBusStops(location);
    const allBusStopCode = await getBusStopCode(nearbyBusStops);
    const busArrivals = await getBusArrival(allBusStopCode)
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
        console.log(data);
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

                        if(bothOpp || bothNotOpp){
                            const NORMALIZATION_MAP = {
                                "int" : "interchange",
                                "stn" : "station",
                                "ave" : "avenue",
                                "rd" : "road",
                                "ctr" : "centre",
                                "blk" : "block"
                            };

                            const COMMON_WORDS = ["opp", "bus", "stop", "station", "stn", "int", "road", "rd", "ave", "blk"];

                            const normalizeToken = (token) => {
                                // Lowercase the token and strips out non-alphanumeric characters
                                const cleaned = token.toLowerCase().replace(/[^a-z0-9]/gi, '');
                                
                                // Standardise abbreviations using Normalization map
                                return NORMALIZATION_MAP[cleaned] || cleaned;
                            }

                            const tokenSize = (text) => {
                                return text
                                    .split(/[\s/,-]+/)    // Split on space, slash, comma, hyphen
                                    .map(normalizeToken)    // Clean and normalise words like stn -> station
                                    .filter(t => t && !COMMON_WORDS.includes(t));    // Remove generic and common words
                            }

                            const googleTokens = tokenSize(googleName);
                            const ltaTokens = tokenSize(ltaName);

                            const common = googleTokens.filter(t => ltaTokens.includes(t)); // all words (tokens) that appear in both the Google Name and Lta name
                            const hasEnoughTokens = common.length >= 2; // Return true if they share 2 or more useful tokens

                            // Safety check to prevent bad matches between places that are similar 
                            const KEY_SUFFIXES = ["stn", "station", "ctr", "centre", "int", "interchange", "mall", "plaza"];

                            // Check if both sides contain a known suffix keyword
                            const googleSuffix = googleTokens.find(t => KEY_SUFFIXES.includes(t));
                            const ltaSuffix = ltaTokens.find(t => KEY_SUFFIXES.includes(t));

                            // If suffix are not the same, it is marked as conflict
                            // For example, "beauty", "world", "stn" and "beauty", "world", "ctr" has good match ratio
                            // but stn != ctr, so endsWithConflixt == true
                            const endsWithConflict = googleSuffix && ltaSuffix && googleSuffix !== ltaSuffix;

                            // Ensure the names are sufficiently similar, they don't refer to different place types
                            // Ensure the LTA name fully includes the meaning of the google name
                            if (hasEnoughTokens && !endsWithConflict && googleTokens.every(t => ltaTokens.includes(t))){
                                matched = true
                            }
                        }
                    }

                    if (matched) {
                        if (filteredBusStops.some(stop => stop.BusStopCode === lta.BusStopCode)) {
                            console.log("⚠️ Match found but already added:", lta.Description, lta.BusStopCode);
                        } else {
                            console.log("✅ New match:", nearby.displayName.text, "→", lta.Description, `(${lta.BusStopCode})`);
                            filteredBusStops.push({ltaBusStops: lta, googleMapsLinks: nearby.googleMapsLinks.directionsUri});
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

async function getBusArrival(busStops){
    let allBusArrivals = [];

    for (let i = 0; i < busStops.length; i++) {
        const busStopCode = busStops[i].ltaBusStops.BusStopCode;
        try {
            const response = await fetch(`${apiBaseUrl}/busArrival?busStopCode=${busStopCode}`, {
                method: 'GET',
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                const errorBody = response.headers
                    .get("content-type")
                    ?.includes("application/json")
                    ? await response.json()
                    : { message: response.statusText };
                throw new Error(`HTTP Error! status ${response.status}, message: ${errorBody.message}`);
            }

            const busArrivals = await response.json();
            allBusArrivals.push({busStopName: busStops[i].ltaBusStops.Description, arrivals: busArrivals, googleMapsLinks: busStops[i].googleMapsLinks});

        } catch (error) {
            console.error("Error getting bus arrival for", busStopCode, error.message);
        }
    }
    console.log(allBusArrivals);
    return allBusArrivals;
}

async function renderBusArrival(busStops){
    const busStopSection = document.getElementById("bus-stop-section")
    busStops.forEach(async (busStop) => {
        const busServices = busStop.arrivals.Services;
        const busStopBlock = document.createElement("div");
        busStopBlock.classList.add("bus-stop-block");

        busStopBlock.innerHTML = `
            <div class="bus-stop-header">
              <strong>${busStop.busStopName}</strong>
              <span class="bookmark">🔖</span>
            </div>
            <div class="bus-cards"> </div>
            <div class="actions">
              <a href="#">See picture &gt;&gt;</a>
              <a href="${busStop.googleMapsLinks}" class="take-me-there-btn" target="_blank">Take me there</a>
            </div>
        `

        const busCards = document.getElementById("bus-cards");
        let arrivals = [];
        busServices.forEach(async (service) => {
            let arrivalInfo = { busNumber: service.ServiceNo};
            ["NextBus", "NextBus2", "NextBus3"].forEach((key, idx) => {
                const bus = service[key];
                let displayDifference = "Not Available";
                if(bus && bus.EstimatedArrival){
                    const arrivalTime = new Date(bus.EstimatedArrival);
                    const now = new Date();

                    const diffMs = arrivalTime - now; // This is difference in milliseconds
                    const diffMins = Math.round(diffMs / 60000); // Convert to minutes

                    displayDifference = diffMins > 0 ? `${diffMins} min` : "Arriving";
                }

                arrivalInfo[`bus${idx + 1}`] = displayDifference;
            })
        })
    })
}

