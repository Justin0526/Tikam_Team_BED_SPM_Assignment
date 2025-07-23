const apiBaseUrl = "http://localhost:3000";
// This function gets the user's current location (latitude and longitude)
// It returns a Promise so we can use async and await with it
window.addEventListener('load', async()=>{
    await getToken(token);
    const location = await getLocation();

    getFacilities(location);

    getTransport(location, ["subway_station", "train_station", "light_rail_station"], "train-card-container", 
        (type) => `${type == "light_rail_station" ? "LRT" : "MRT"} Station`
        // This tells the render function if type == "light_rail_station" label as LRT, else label as MRT
    );

    getTransport(location, ["bus_station", "bus_stop"], "bus-card-container",
        (type) => `${type == "bus_stop" ? "Bus Stop" : "Bus Station"}`
    );

});

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

async function getFacilities(location){
    console.log("Latitude: ", location.latitude);
    console.log("Longitude: ", location.longitude);

    const includedTypes = [null];
    const radius = 1000;
    const maxResultCount = 3;
    const locationRestriction = {
        "circle": {
            "center":{
                "latitude": location.latitude,
                "longitude": location.longitude
            },
            "radius": radius
        }
    }

    try{
        const reqBody = {
            includedTypes: includedTypes,
            maxResultCount: maxResultCount,
            locationRestriction: locationRestriction
        }

        const response = await fetch(`${apiBaseUrl}/nearbyFacilities`, {
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
            throw new Error(`HTTP Error! status ${response.status}, message: ${errorBody.message}`);
        }

        const data = await response.json();
        const results = data.places;

        renderFacilities(results);

    } catch(error){
        console.error("Error fetching facilities", error);
        alert("Failed to load facility info");
    };
    
};

async function getTransport(location, includedTypes, containerId, typeLabelFunction){
    const reqBody = {
        includedTypes,
        maxResultCount: 2,
        rankPreference: "DISTANCE",
        locationRestriction: {
            circle: {
                center: location,
                radius: 10000
            }
        }
    };

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
        const results = data.places;
        renderTransport(results, containerId, typeLabelFunction);
    }catch(error){
        console.error("Error fetching transport: ",error);
        alert("Failed to load transport info");
    }
}

async function renderFacilities(results){
    const facilityCardsSection = document.getElementById("facility-cards-section");

    results.forEach(async (result) => {
        const facilityCard = document.createElement("div");
        facilityCard.classList.add("facility-card");

        const openNow = result.currentOpeningHours?.openNow === true ? "Open": "Closed";
        console.log(result);

        facilityCard.innerHTML = `
            <p><strong>Name:</strong> ${result.displayName.text}</p>
            <p><strong>Address:</strong> ${result.formattedAddress}</p>
            <p><strong>Opening Hours:</strong> ${openNow}</p>
            <a href="${result.googleMapsLinks.directionsUri}" class="get-directions-btn" target="_blank">Get Directions</a>
        `;

        facilityCardsSection.appendChild(facilityCard);
    });
};

async function renderTransport(results, containerId, typeLabelFunction){
    const container = document.getElementById(containerId);

    results.forEach(result => {
        const card = document.createElement("div");
        card.classList.add("transport-card");

        const label = typeLabelFunction(result.primaryType);
         card.innerHTML = `
            <p><strong>Name: </strong> ${result.displayName.text}</p>
            <p><strong>Type: </strong> ${label} </p>
            <a href='#' class="view-more" target="_blank">View more</a>
        `;
        container.appendChild(card);
    })
}
