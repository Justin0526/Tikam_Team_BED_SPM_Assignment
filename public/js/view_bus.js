// Justin Tang Jia Ze S10269496B
// const apiBaseUrl = "http://localhost:3000";
const goBtn = document.getElementById("go-btn");
const textQuery = document.getElementById("textQuery");
const sectionTitle = document.getElementById("section-title");
const busStopSection = document.getElementById("bus-stop-section");

// Load nearby bus stops and display it
window.addEventListener('load', async() =>{
    await getToken(token);
    const loadingMessage = document.getElementById("loading-message");
    loadingMessage.textContent = "Loading nearby bus stops...";

    const location = await getLocation();
    const nearbyBusStops = await getBusStops(location);
    const allBusStopCode = await getBusStopCode(nearbyBusStops);
    const busArrivals = await getBusArrival(allBusStopCode)
    const displayBus = await renderBusArrival(busArrivals);

    loadingMessage.textContent = ""; // Hide after loaded
})

// Search nearby bus stops via textbox
goBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    currentQuery = textQuery.value;

    if (!currentQuery) return alert("Please enter a search term.");

    busStopSection.innerHTML = "";
    await searchBusStops(currentQuery);
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

// Get all bus stops within a radius of 2000m
async function getBusStops(location){
    console.log(location);
    const reqBody = {
        includedTypes: ["bus_station", "bus_stop"],
        maxResultCount: 20,
        rankPreference: "DISTANCE",
        locationRestriction: {
            circle: {
                center: location,
                radius: 2000
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

// Get the bus stop codes of the bus stops we get, this is to prepare to get bus arrivals
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
                            filteredBusStops.push({ltaBusStops: lta, googleMapsLinks: nearby.googleMapsLinks.directionsUri, placeID: nearby.id, placeName: nearby.displayName.text});
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

// Get bus arrivals via all bus stop code
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

            const stop = busStops[i];
            const busArrivals = await response.json();
            allBusArrivals.push({
                busStopName: stop.ltaBusStops.Description,
                arrivals: busArrivals,
                googleMapsLinks: stop.googleMapsLinks,
                placeID: stop.placeID,
                placeName: stop.placeName
            });

        } catch (error) {
            console.error("Error getting bus arrival for", busStopCode, error.message);
        }
    }
    return allBusArrivals;
}

// Display all bus arrivals
async function renderBusArrival(busStops){
    const busStopSection = document.getElementById("bus-stop-section")
    busStops.forEach(async (busStop) => {
        const busServices = busStop.arrivals.Services;

        const busStopBlock = document.createElement("div");
        busStopBlock.classList.add("bus-stop-block");
        busStopBlock.innerHTML = `
            <div class="bus-stop-header">
              <strong>${busStop.busStopName}</strong>
              <img width="50" height="50" src="../images/unfilled-bookmark-icon.png" class="bookmark-icon" data-place-id="${busStop.placeID}">
            </div>
            <div class="bus-cards"> </div>
            <div class="actions">
              <a href="${busStop.googleMapsLinks}" class="take-me-there" target="_blank">Take me there</a>
            </div>
        `

        const busCards = busStopBlock.querySelector(".bus-cards");

        let hasAnyArrivalAtStop = false
        let arrivals = [];
        for (const service of busServices) {
            let arrivalInfo = { busNumber: service.ServiceNo };
            let hasArrivalThisService = false;

            ["NextBus", "NextBus2", "NextBus3"].forEach((key, idx) => {
                const bus = service[key];
                let displayDifference = "Not Available";
                if (bus && bus.EstimatedArrival) {
                    const arrivalTime = new Date(bus.EstimatedArrival);
                    const now = new Date();

                    const diffMs = arrivalTime - now;
                    const diffMins = Math.round(diffMs / 60000);
                    displayDifference = diffMins > 0 ? `${diffMins} min` : "Arrived";

                    hasArrivalThisService = true;
                    hasAnyArrivalAtStop = true;
                }

                arrivalInfo[`bus${idx + 1}`] = displayDifference;
            });

            arrivals.push(arrivalInfo);
        }
        // If all are Not Available or empty, mark as no more buses
       // If no services had any upcoming buses, show a single message
        if (!hasAnyArrivalAtStop) {
            const noBusMsg = document.createElement("div");
            noBusMsg.classList.add("no-bus-msg");
            noBusMsg.innerHTML = "<em>No more buses scheduled for this stop at this moment of time.</em>";
            busCards.appendChild(noBusMsg);
        } else {
            // Show each service's arrival
            arrivals.forEach(arrival => {
                const busCard = document.createElement("div");
                busCard.classList.add("bus-card");
                busCard.innerHTML = `
                    Bus ${arrival.busNumber}
                    <button>${arrival.bus1}</button>
                    <button>${arrival.bus2}</button>
                    <button>${arrival.bus3}</button>
                `;
                busCards.appendChild(busCard);
            });
        }

        busStopSection.appendChild(busStopBlock);

        const bookmarkImg = busStopBlock.querySelector(".bookmark-icon");
        const placeID = busStop.placeID;
        const placeName = busStop.placeName;

        isFacilityBookmarked(placeID).then(bookmarked => {
            bookmarkImg.src = bookmarked ? window.filledIcon : window.unfilledIcon;
            bookmarkImg.setAttribute("data-bookmarked", bookmarked);

            bookmarkImg.addEventListener("mouseenter", () => {
                bookmarkImg.style.cursor = "pointer";
                if (bookmarkImg.getAttribute("data-bookmarked") === "false") {
                    bookmarkImg.src = window.filledIcon;
                }

            });

            bookmarkImg.addEventListener("mouseleave", () => {
                if (bookmarkImg.getAttribute("data-bookmarked") === "false") {
                    bookmarkImg.src = window.unfilledIcon;
                }
            });
        });

        bookmarkImg.addEventListener("click", async () => {
            await window.handleBookmarkClick(placeID, placeName);
            if (!token) {
                alert("You must be signed in to create categories.");
                return null;
            }
        });

        
    })
}

// Search bus stop and display the bus arrival 
async function searchBusStops(query){
    try{
        const reqBody = {
            textQuery: query.toLowerCase().trim(),
            includedType: "bus_stop"
        };

        const response = await fetch(`${apiBaseUrl}/facilities`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(reqBody)
        })

        if(!response.ok){
            const errorBody = response.headers
                .get("content-type")
                ?.includes("application/json")
                ? await response.json()
                : {message: response.statusText};
            throw new Error(`HTTP Error! status ${response.status}, message: ${errorBody.message}`);
        }

        const data = await response.json();
        const results = data.places;

        if (!Array.isArray(results) || results.length === 0){
            sectionTitle.textContent = `No results for: ${query}`;
            return;
        }

        sectionTitle.textContent = `Results for: ${query}`;
        const allBusStopCode = await getBusStopCode(results);
        const allBusArrival = await getBusArrival(allBusStopCode);
        await renderBusArrival(allBusArrival);
    }catch(error){
        console.error("Error searching bus stops", error);
        alert("Failed to search bus stops");
    }
}