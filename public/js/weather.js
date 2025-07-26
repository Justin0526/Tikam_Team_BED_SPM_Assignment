const apiBaseUrl = "http://localhost:3000";
let currentUser = null;

const hourlyWeatherForecastListDiv = document.getElementById("hourly-forecast-list");
const sevenDayWeatherForecastListDiv = document.getElementById("seven-day-forecast-list");

let outfitData = null;

const definitionToggles = document.querySelectorAll(".toggle-definition");

// Function to fetch weather information from API and display them
async function fetchAllData(){
    try {
        // Make get request to API endpoint
        const response = await fetch(`${apiBaseUrl}/weather`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if(!response.ok){
            // Handle HTTP errors (e.g. 404, 500)
            // Attempt to read error body if available, otherwise use status text
            const errorBody = response.headers
              .get("content-type")
              ?.includes("application/json")
              ?await response.json()
              : {message: response.statusText};
            throw new Error(
                `HTTP Error! status ${response.status}, message: ${errorBody.message}`
            )
            
        }
        sevenDayWeatherForecastListDiv.innerHTML = "Loading Seven Day Forecast...";
        hourlyWeatherForecastListDiv.innerHTML = "Loading Hourly Forecast...";

        // Parse the JSON response
        const Alldata = await response.json();
        const weatherData = Alldata.weather;
        outfitData = Alldata.outfit;

        displayWeatherSummary(weatherData);
        displayHourlyForecast(weatherData);
        displaySevenDayForecast(weatherData);
        displaySuggestedOutfit(outfitData, weatherData);

    }catch(error){
        console.error("Error fetching weather information", error);
        alert("Failed to load weather info")
    }
}
async function displayWeatherSummary(weatherData){
    const currentWeatherSummary = document.getElementById("current-weather-summary");
    const temperature = document.getElementById("weather-temperature");
    const feelsLike = document.getElementById("weather-feels-like");
    const uvIndex = document.getElementById("weather-uv-index");
    const humidity = document.getElementById("weather-humidity");
    const windSpeed = document.getElementById("weather-wind-speed");
    const condition = document.getElementById("weather-condition");
    const conditionIcon = document.getElementById("weather-condition-icon");
    const sunrise = document.getElementById("weather-sunrise");
    const sunset = document.getElementById("weather-sunset");
    
    const currentWeather = weatherData.current;
    const astroToday = weatherData.forecast.forecastday[0].astro;

    const now = new Date();
    const formattedDate = `${String(now.getMonth() + 1).padStart(2, '0')}/` + 
                            `${String(now.getDate()).padStart(2, '0')}/` +
                            `${now.getFullYear()} ` +  
                            `${String(now.getHours()).padStart(2, '0')}:` + 
                            `${String(now.getMinutes()).padStart(2, '0')}`; 

    currentWeatherSummary.textContent = `🌞 Current Weather Summary (${formattedDate})`;
    temperature.textContent = `Temperature: ${currentWeather.temp_c}°C`;
    feelsLike.textContent = `Feels Like: ${currentWeather.feelslike_c}°C`;
    uvIndex.textContent = `UV Index: ${currentWeather.uv}`;
    humidity.textContent = `Humidity: ${currentWeather.humidity}%`;
    windSpeed.textContent = `Wind Speed: ${currentWeather.wind_kph} km/h`;
    condition.textContent = `Condition: ${currentWeather.condition.text}`;
    conditionIcon.src = `https:${currentWeather.condition.icon}`;
    sunrise.textContent = `Sunrise: ${astroToday.sunrise}`;
    sunset.textContent = `Sunset: ${astroToday.sunset}`;        

}

async function displayHourlyForecast(weatherData){
    const weatherForecastDay = weatherData.forecast.forecastday;

    // Get the local time
    const localTime = new Date();
    let count = 0;

    // Clear previous loading message
    hourlyWeatherForecastListDiv.innerHTML = "";

    weatherForecastDay.forEach((forecast) => {
        const weatherForecastHourTest = forecast.hour;
        weatherForecastHourTest.forEach((forecastHour) => {          
            const APIlocalTime = new Date(forecastHour.time);
            if(APIlocalTime >= localTime && count <7){
                const timeOnly = forecastHour.time.split(" ")[1];
                const forecastItem = document.createElement("div");
                forecastItem.classList.add("forecast-item");
                forecastItem.innerHTML = `
                    <div class="forecast-time">${timeOnly}</div>
                    <div class="forecast-icon"><img src="https:${forecastHour.condition.icon}"></div>
                    <div class="forecast-temp">${forecastHour.temp_c}°C</div>
                    <div class="forecast-desc">${forecastHour.condition.text}</div>
                `
                hourlyWeatherForecastListDiv.appendChild(forecastItem);
                count ++;
            }
        })
    })
}

async function displaySevenDayForecast(weatherData){
    const weatherForecastDay = weatherData.forecast.forecastday;

    // Clear loading message
    sevenDayWeatherForecastListDiv.innerHTML = "";
    
    weatherForecastDay.forEach((forecast)=> {
        const date = new Date(forecast.date).toString();
        const day = date.split(" ")[0];

        const forecastItem = document.createElement("div");
        forecastItem.classList.add("forecast-item");
        forecastItem.innerHTML = `
            <div class="forecast-day">${day}</div>
            <div class="forecast-icon"><img src=https:${forecast.day.condition.icon}></div>
            <div class="forecast-temp">${forecast.day.avgtemp_c}°C</div>
            <div class="forecast-rain">Rain: ${forecast.day.daily_chance_of_rain}%</div>
        `
        sevenDayWeatherForecastListDiv.appendChild(forecastItem);
    })

}

// Function to display suggested outfit
async function displaySuggestedOutfit(outfitData, weatherData) {
    const outfitContent = document.getElementById("outfit-content");
    outfitContent.innerHTML = ""; // Clear existing content

    console.log("Outfit Data", outfitData);

    outfitData.forEach(outfit => {
        const outfitContentCard = document.createElement("div");
        outfitContentCard.classList.add("outfit-card-item");
        outfitContentCard.innerHTML = `
            <img alt="Outfit Picture" src="${outfit.outfitImageURL}">
            <div class="outfit-text">
                <p class="outfit-description">${outfit.outfitDesc}</p>
                <p class="outfit-message"></p>
                <div class="button-group">
                    <a href="#" class="button btn-yellow fav-outfit-btn">💖 Like this Outfit</a>
                    <a href="../html/favourite_outfit.html" class="button btn-yellow">💖 View My Favourite Outfits</a>
                </div>
            </div>
        `;

        outfitContent.appendChild(outfitContentCard);

        // Select elements from the current card only
        const likeBtn = outfitContentCard.querySelector(".fav-outfit-btn");
        const outfitMsg = outfitContentCard.querySelector(".outfit-message");

        likeBtn.addEventListener("click", async (event) => {
            event.preventDefault();

            if (!currentUser) {
                outfitMsg.innerHTML = `<a href="login.html">Please log in to favourite an outfit.</a>`;
                outfitMsg.style.color = "red";
                return;
            }

            console.log(weatherData);
            const favouriteOutfit = {
                outfitID: outfit.outfitID,
                weatherCondition: weatherData.current.condition.text
            };

            try {
                const response = await fetch(`${apiBaseUrl}/weather`, {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(favouriteOutfit),
                });

                const responseBody = response.headers
                    .get("content-type")
                    ?.includes("application/json")
                    ? await response.json()
                    : { message: response.statusText };

                if (response.status === 201) {
                    outfitMsg.textContent = "Successfully favourited outfit!";
                    outfitMsg.style.color = "green";
                    setTimeout(() => {
                        outfitMsg.textContent = "";
                    }, 2000);
                } else if (response.status === 400) {
                    outfitMsg.textContent = `Error: ${responseBody.message}`;
                    outfitMsg.style.color = 'red';
                } else {
                    throw new Error(`API error! status: ${response.status}, message: ${responseBody.message}`);
                }
            } catch (error) {
                outfitMsg.textContent = `Failed to favourite outfit: ${error.message}`;
                outfitMsg.style.color = 'red';
            }
        });
    });
}

definitionToggles.forEach((definition)=> {
    definition.addEventListener("click", ()=> {
        const targetId = definition.getAttribute("data-target");
        const target = document.getElementById(targetId);
        if(target){
            target.classList.toggle("hidden");
        }
    })
})
window.addEventListener('load', async () =>{
    currentUser = await getToken(token);
    fetchAllData();
})