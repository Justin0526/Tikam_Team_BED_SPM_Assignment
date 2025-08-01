let currentUser = null;
const apiBaseURl = "http://localhost:3000/api";
let userID = null;

window.addEventListener('load', async () => {
    currentUser = await getToken(token);
    if (currentUser) {
        userID = currentUser.userID;
        renderCharts();
    } else {
        disableCharts();
    }
});

function disableCharts() {
    document.querySelectorAll(".chart-card").forEach(card => {
        card.classList.add("disabled");
    });
}

// ====================== GLOBAL VARIABLES ======================
const modal = document.getElementById("logsModal");
const chartModal = document.getElementById("chartModal");
let currentType = "";
let enlargedChartInstance;

// ====================== FETCH DATA ======================
async function fetchHealthRecords() {
    if (!userID) return [];
    try {
        const res = await fetch(`${apiBaseURl}/healthRecords/${userID}`);
        if (!res.ok) throw new Error("Failed to fetch health records");
        return await res.json();
    } catch (error) {
        console.error("Error fetching health records:", error);
        return [];
    }
}

// ====================== RENDER CHARTS ======================
async function renderCharts() {
    const data = await fetchHealthRecords();
    if (!data.length) return;

    const bpData = data.filter(d => d.recordType === "blood_pressure");
    const sugarData = data.filter(d => d.recordType === "sugar");
    const weightData = data.filter(d => d.recordType === "weight");

    createChart("bpChart", bpData.map(d => formatDate(d.recordedAt)), [
        { label: "Systolic", data: bpData.map(d => d.value1), borderColor: "red" },
        { label: "Diastolic", data: bpData.map(d => d.value2), borderColor: "blue" }
    ]);

    createChart("sugarChart", sugarData.map(d => formatDate(d.recordedAt)), [
        { label: "Blood Sugar", data: sugarData.map(d => d.value1), borderColor: "green" }
    ]);

    createChart("weightChart", weightData.map(d => formatDate(d.recordedAt)), [
        { label: "Weight", data: weightData.map(d => d.value1), borderColor: "purple" }
    ]);
}

function createChart(canvasId, labels, datasets) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    if (Chart.getChart(ctx)) Chart.getChart(ctx).destroy(); // ✅ Destroy previous chart
    new Chart(ctx, {
        type: "line",
        data: { labels, datasets },
        options: {
            responsive: true,
            plugins: { legend: { display: true } }
        }
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
}

// ====================== MODAL FUNCTIONS ======================
function openModal(type) {
    if (!userID) {
        alert("Please log in to view details.");
        return;
    }
    modal.style.display = "flex";
    document.getElementById("modalTitle").innerText = type.toUpperCase() + " Logs";
    document.getElementById("recordType").value = type;
    currentType = type;
    resetForm();

    // ✅ Show Value2 only for blood_pressure
    if (type === "blood_pressure") {
        document.querySelector("label[for='value2']").style.display = "block";
        document.getElementById("value2").style.display = "block";
    } else {
        document.querySelector("label[for='value2']").style.display = "none";
        document.getElementById("value2").style.display = "none";
    }

    loadLogs(type);
}

function closeModal() {
    modal.style.display = "none";
}

window.onclick = function (event) {
    if (event.target === modal) closeModal();
    if (event.target === chartModal) closeChartModal();
};

// ====================== LOG TABLE & FORM ======================
function resetForm() {
    document.getElementById("recordID").value = "";
    document.getElementById("logDate").value = "";
    document.getElementById("value1").value = "";
    document.getElementById("value2").value = "";
    document.getElementById("formTitle").innerText = "Add/Edit Log";
}

function showAddForm() {
    resetForm();
    document.getElementById("formTitle").innerText = "Add New Log";
}

async function loadLogs(type) {
    const data = await fetchHealthRecords();
    const filtered = data.filter(d => d.recordType === type);

    const tbody = document.querySelector("#logsTable tbody");
    tbody.innerHTML = "";

    filtered.forEach(record => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${formatDate(record.recordedAt)}</td>
            <td>${record.value1}</td>
            <td>${record.value2 || "-"}</td>
            <td>
                <button onclick="editLog(${record.recordID}, '${record.recordedAt}', ${record.value1}, ${record.value2 || null})">Edit</button>
                <button onclick="deleteLog(${record.recordID})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editLog(id, date, val1, val2) {
    document.getElementById("recordID").value = id;
    document.getElementById("logDate").value = date.split("T")[0];
    document.getElementById("value1").value = val1;
    document.getElementById("value2").value = val2 || "";
    document.getElementById("formTitle").innerText = "Edit Log";
}

// ====================== SAVE (Add/Update) ======================
async function saveLog(event) {
    event.preventDefault();

    const recordID = document.getElementById("recordID").value;
    const recordType = document.getElementById("recordType").value;
    const date = document.getElementById("logDate").value;
    const value1 = parseFloat(document.getElementById("value1").value);
    const value2Raw = document.getElementById("value2").value;
    const value2 = value2Raw ? parseFloat(value2Raw) : null;

    // Future date validation
    const today = new Date();
    const selectedDate = new Date(date);
    if (!date) {
        alert("Please select a date.");
        return;
    }
    if (selectedDate > today) {
        alert("You cannot add a log for a future date.");
        return;
    }

    // Negative values validation
    if (Number.isNaN(value1) || value1 < 0) {
        alert("Value 1 cannot be negative or empty.");
        return;
    }
    if (value2 !== null && (Number.isNaN(value2) || value2 < 0)) {
        alert("Value 2 cannot be negative.");
        return;
    }

    //Check for duplicate date if adding a new record
    if (!recordID) {
        const existingLogs = await fetchHealthRecords();
        const duplicate = existingLogs.find(log =>
            log.recordType === recordType && log.recordedAt.split("T")[0] === date
        );
        if (duplicate) {
            alert("You already have a record for this date. Please click Edit to make changes.");
            return;
        }
    }

    console.log("VALIDATION PASSED → Proceeding to fetch...");

    const payload = { userID, recordType, value1, value2, recordedAt: date };

    try {
        const method = recordID ? "PUT" : "POST";
        const url = recordID ? `${apiBaseURl}/healthRecords/${recordID}` : `${apiBaseURl}/healthRecords`;

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed to save log");

        alert(recordID ? "Log updated successfully!" : "Log added successfully!");
        resetForm();
        loadLogs(currentType);
        renderCharts();
    } catch (error) {
        console.error("Error saving log:", error);
    }
}

// ====================== DELETE LOG ======================
async function deleteLog(recordID) {
    if (confirm("Are you sure you want to delete this log?")) {
        try {
            const res = await fetch(`${apiBaseURl}/healthRecords/${recordID}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete record");
            alert("Record deleted successfully!");
            loadLogs(currentType);
            renderCharts();
        } catch (error) {
            console.error("Error deleting record:", error);
        }
    }
}

// ====================== ENLARGE CHART ======================
document.querySelectorAll(".enlarge-chart").forEach(canvas => {
    canvas.addEventListener("click", () => {
        chartModal.style.display = "flex";
        const ctx = document.getElementById("enlargedChart").getContext("2d");
        if (enlargedChartInstance) enlargedChartInstance.destroy();

        const originalChart = Chart.getChart(canvas);
        enlargedChartInstance = new Chart(ctx, {
            type: originalChart.config.type,
            data: originalChart.data,
            options: {
                responsive: true,
                plugins: {
                    zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "xy" } }
                }
            }
        });
    });
});

function closeChartModal() {
    chartModal.style.display = "none";
}

function calculateBMI() {
    const weight = parseFloat(document.getElementById("bmiWeight").value);
    const height = parseFloat(document.getElementById("bmiHeight").value);

    // Negative values validation
    if (Number.isNaN(weight) || weight < 0) {
        alert("Weight cannot be negative or empty.");
        return;
    }

    if (Number.isNaN(height) || height < 0) {
        alert("Height cannot be negative or empty."); 
        return;
    }
    
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

// this is for when taking into account age and gender

// function calculateBMI() {
//     const weight = parseFloat(document.getElementById("bmiWeight").value);
//     const height = parseFloat(document.getElementById("bmiHeight").value);
//     const age = parseInt(document.getElementById("bmiAge").value);
//     const gender = document.getElementById("bmiGender").value;

//     if (!weight || !height || !age || !gender) {
//         alert("Please enter weight, height, age, and select gender.");
//         return;
//     }

//     const bmi = (weight / (height * height)).toFixed(2);
//     let category = "";
//     let advice = "";

//     if (age < 18) {
//         category = "Youth";
//         advice = "BMI interpretation varies for children. Please consult a doctor.";
//     } else if (age >= 65) {
//         if (bmi < 22) category = "Underweight";
//         else if (bmi <= 28) category = "Healthy for older adults";
//         else if (bmi <= 32) category = "Overweight";
//         else category = "Obese";
//         advice = "For seniors, a slightly higher BMI is normal. Focus on strength and balance.";
//     } else {
//         if (bmi < 18.5) category = "Underweight";
//         else if (bmi < 25) category = "Normal";
//         else if (bmi < 30) category = "Overweight";
//         else category = "Obese";

//         // Gender-based advice
//         if (category === "Overweight" || category === "Obese") {
//             advice = gender === "Female"
//                 ? "Try low-impact workouts and balanced meals."
//                 : "Include cardio and strength training in your routine.";
//         } else {
//             advice = "Maintain your healthy lifestyle!";
//         }
//     }

//     document.getElementById("bmiResult").innerHTML = `
//         <strong>BMI: ${bmi}</strong><br>
//         <span style="font-size: 14px; color: #333;">Category: ${category}</span><br>
//         <span style="font-size: 13px; color: #555;">${advice}</span>
//     `;
// }
