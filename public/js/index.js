const apiBaseUrl = "http://localhost:3000";

window.addEventListener("DOMContentLoaded", async () => {
  try {
    currentUser = await getToken(token);
    //add debug for currentUser line
    console.debug("Current user:", currentUser);
    const response = await fetch(`${apiBaseUrl}/weather`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Weather API failed");

    const data = await response.json();
    const current = data.weather.current;

    document.getElementById("summary-temperature").textContent = `${current.temp_c}°C`;
    let uvLevel;
    if (current.uv <= 2) {
      uvLevel = "Low";
    } else if (current.uv <= 5) {
      uvLevel = "Moderate";
    } else if (current.uv <= 7) {
      uvLevel = "High";
    } else {
      uvLevel = "Very High";
    }
    document.getElementById("summary-uv").innerHTML = `${uvLevel} (${current.uv})`;
    document.getElementById("summary-condition").textContent = current.condition.text;

  } catch (err) {
    console.error("Failed to fetch weather for index:", err);
    document.getElementById("summary-temperature").textContent = "N/A";
    document.getElementById("summary-uv").textContent = "N/A";
    document.getElementById("summary-condition").textContent = "N/A";
  }
});
