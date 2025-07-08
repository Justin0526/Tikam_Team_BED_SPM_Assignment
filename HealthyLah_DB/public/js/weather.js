const temperature = document.getElementById("weather-temperature");
const feelsLike = document.getElementById("weather-feels-like");
const uvIndex = document.getElementById("weather-uv-index");
const humidity = document.getElementById("weather-humidity");
const windSpeed = document.getElementById("weather-wind-speed");
const condition = document.getElementById("weather-condition");
const conditionIcon = document.getElementById("weather-condition-icon");
const sunrise = document.getElementById("weather-sunrise");
const sunset = document.getElementById("weather-sunset");
const hourlyWeatherForecastListDiv = document.getElementById("hourly-forecast-list");
const sevenDayWeatherForecastListDiv = document.getElementById("seven-day-forecast-list");
const definitionToggles = document.querySelectorAll(".toggle-definition");
const apiBaseUrl = "http://localhost:3000";

// Function to fetch weather information from API and display them
async function fetchWeatherSummary(){
    try{

        // Make get request to API endpoint
        const response = await fetch(`${apiBaseUrl}/weather`);

        if (!response.ok){
            // Handle HTTP errors (e.g. 404, 500)
            // Attempt to read error body if available, otherwise use status text
            const errorBody = response.headers
              .get("content-type")
              ?.includes("application/json")
              ? await response.json()
              : {message: response.statusText};
            throw new Error(
                `HTTP Error! status ${response.status}, message: ${errorBody.message}`
            );
        }

        // Parse the JSON response
        const weatherData = await response.json();
        const currentWeather = weatherData.weather.current;
        const astroToday = weatherData.weather.forecast.forecastday[0].astro;

        // console.log(weather);
        // console.log(currentWeather);
        // Display weather
        temperature.textContent = `Temperature: ${currentWeather.temp_c}°C`;
        feelsLike.textContent = `Feels Like: ${currentWeather.feelslike_c}°C`;
        uvIndex.textContent = `UV Index: ${currentWeather.uv}`;
        humidity.textContent = `Humidity: ${currentWeather.humidity}%`;
        windSpeed.textContent = `Wind Speed: ${currentWeather.wind_kph} km/h`;
        condition.textContent = `Condition: ${currentWeather.condition.text}`;
        conditionIcon.src = `https:${currentWeather.condition.icon}`;
        sunrise.textContent = `Sunrise: ${astroToday.sunrise}`;
        sunset.textContent = `Sunset: ${astroToday.sunset}`;        

    }catch(error){
        console.error("Error fetching weather summary: ", error);
        alert("Failed to load weather for Weather Summary");
    }
}

async function fetchHourlyForecast(){
    try{
        hourlyWeatherForecastListDiv.innerHTML = "Loading weather...";
        const response = await fetch(`${apiBaseUrl}/weather`);

        if(!response.ok){
            // Handle HTTP errors (e.g. 404, 500)
            // Attempt to read error body if available, otherwise use status text
            const errorBody = response.headers
              .get("content-type")
              ?. includes("application/json")
              ? await response.json()
              : {message: response.statusText};
            throw new Error(
                `HTTP Error! status: ${response.status}, message: ${errorBody.message}`
            );
        }

        // Parse the JSON response
        const weatherData = await response.json();
        const weatherForecastDay = weatherData.weather.forecast.forecastday;

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
    }catch(error){
        console.error("Error fetching hourly weather: ", error);
        alert("Failed to load weather for Hourly Forecast")
    }
}

async function fetchSevenDayForecast(){
    try{
        sevenDayWeatherForecastListDiv.innerHTML = "Loading Weather...";
        const response = await fetch(`${apiBaseUrl}/weather`);

        if (!response.ok){
            // Handle HTTP errors (e.g. 404, 500)
            // Attempt to read error body if available, otherwise use status text
            const errorBody = response.headers
              .get("content-type")
              ?. includes("application/json")
              ? await response.json()
              : {message: response.statusText}
            throw new Error(
                `HTTP Error! status: ${response.status}, message: ${errorBody.message}`
            );
        }

        // Parse the JSON response
        const weatherData = await response.json();
        const weatherForecastDay = weatherData.weather.forecast.forecastday;

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
    }catch(error){
        console.error("Error fetching 7-day weather forecast: ", error);
        alert("Fail to load 7 days forecast");
    }
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
window.addEventListener('load', fetchWeatherSummary);
window.addEventListener('load', fetchHourlyForecast);
window.addEventListener('load', fetchSevenDayForecast);