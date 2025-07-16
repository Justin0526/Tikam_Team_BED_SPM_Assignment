const apiBaseUrl = "http://localhost:3000";
let currentUser = null;

const hourlyWeatherForecastListDiv = document.getElementById("hourly-forecast-list");
const sevenDayWeatherForecastListDiv = document.getElementById("seven-day-forecast-list");

let outfitData = null;
const outfitImg = document.getElementById("outfit-image");
const outfitDesc = document.getElementById("outfit-description");
const outfitMsg = document.getElementById("outfit-message");
const favOutfitBtn = document.getElementById("fav-outfit-btn");

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
        outfitDesc.textContent = "Loading outfit image and description ";
        outfitMsg.innerHTML = "";

        // Parse the JSON response
        const Alldata = await response.json();
        const weatherData = Alldata.weather;
        outfitData = Alldata.outfit;

        displayWeatherSummary(weatherData);
        displayHourlyForecast(weatherData);
        displaySevenDayForecast(weatherData);
        displaySuggestedOutfit(outfitData);

    }catch(error){
        console.error("Error fetching weather information", error);
        alert("Failed to load weather info")
    }
}
async function displayWeatherSummary(weatherData){
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
async function displaySuggestedOutfit(outfitData){

    // Clear loading message;
    console.log(outfitData);
    outfitDesc.textContent = outfitData[0].outfitDesc;
    outfitImg.src = outfitData[0].outfitImageURL;
}

favOutfitBtn.addEventListener("click", async(event) => {
    event.preventDefault(); // Prevent page jump

    console.log(currentUser);

    if(!currentUser || currentUser == null){
        outfitMsg.innerHTML=`<a href="login.html">Please log in to favourite an outfit.</a>`;
        return;
    }

    const outfitID = outfitData[0].outfitID;

    const favouriteOutfit = {
        outfitID: outfitID,
    }

    try{
        const response = await fetch(`${apiBaseUrl}/weather`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(favouriteOutfit),
        });

        // Check for API response status (201, 400, 500)
        const responseBody = response.headers
          .get("content-type")
          ?. includes("application/json")
          ? await response.json()
          : {message: response.statusText};

        if(response.status === 201){
            outfitMsg.textContent = "Successfully favourited outfit!";
            outfitMsg.style.color = "green";
            console.log("Favourited outfit: ", responseBody);

            // Show for 2 seconds
            setTimeout(() => {
                outfitMsg.textContent = "";
            }, 2000);
        }
        else if (response.status === 400){
            // Handle validation errors from API
            outfitMsg.textContent = `Error: ${responseBody.message}`;
            outfitMsg.style.color = 'red';
            console.error("Validation error: ", responseBody);
        }
        else{
            // Handle other potential API errors (e.g. 500 from error handling middleware)
            throw new Error (
                `API error! status: ${response.status}, message: ${responseBody.message}`
            )
        }
    }catch(error){
        console.error("Error favouriting outfit: ", error);
        outfitMsg.textContent = `Failed to favourite outfit ${error.message}`;
        outfitMsg.style.color = 'red';
    }
})

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