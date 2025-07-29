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

function calculateBMI() {
    const weight = parseFloat(document.getElementById("bmiWeight").value);
    const height = parseFloat(document.getElementById("bmiHeight").value);

    if (!weight || !height) {
        alert("Please enter both weight and height.");
        return;
    }

    const bmi = (weight / (height * height)).toFixed(2);
    let advice = "";

    if (bmi < 18.5) advice = "Underweight: Consider a balanced diet.";
    else if (bmi < 24.9) advice = "Normal: Great job! Maintain your lifestyle.";
    else if (bmi < 29.9) advice = "Overweight: Add more exercise and monitor diet.";
    else advice = "Obese: Consult a doctor for a healthy plan.";

    document.getElementById("bmiResult").innerHTML = `
        <strong>BMI: ${bmi}</strong><br>
        <span style="font-size: 14px; color: #555;">${advice}</span>
    `;
}