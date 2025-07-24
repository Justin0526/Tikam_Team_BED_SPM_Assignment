let currentUser = null;
const apiBaseURl = "http://localhost:3000/api";

window.addEventListener('load', async () => {
  currentUser = await getToken(token);
});

// ====================== GLOBAL VARIABLES ======================
const modal = document.getElementById("logsModal");
const chartModal = document.getElementById("chartModal");
let currentType = "";
let enlargedChartInstance;



// Disable charts if user is not logged in
if (!userID) {
    document.querySelectorAll(".chart-card").forEach(card => {
        card.classList.add("disabled");
    });
}

// ====================== FETCH DATA ======================
async function fetchHealthRecords() {
    if (!userID) return [];
    try {
        const res = await fetch(`/api/healthRecords/${userID}`);
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

    // Group data by record type
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

// Create individual chart
function createChart(canvasId, labels, datasets) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    new Chart(ctx, {
        type: "line",
        data: { labels, datasets },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}

// Format date as DD/MM
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
}

// ====================== BMI CALCULATOR ======================
function calculateBMI() {
    const weight = parseFloat(document.getElementById("bmiWeight").value);
    const height = parseFloat(document.getElementById("bmiHeight").value);

    if (!weight || !height) {
        alert("Please enter both weight and height.");
        return;
    }

    const bmi = (weight / (height * height)).toFixed(2);
    let advice;
    if (bmi < 18.5) advice = "Underweight: Consider a balanced diet.";
    else if (bmi < 24.9) advice = "Normal: Great job! Maintain your lifestyle.";
    else if (bmi < 29.9) advice = "Overweight: Add more exercise and monitor diet.";
    else advice = "Obese: Consult a doctor for a healthy plan.";

    document.getElementById("bmiResult").innerText = `BMI: ${bmi} (${advice})`;
}

// ====================== MODAL FUNCTIONS ======================
function openModal(type) {
    modal.style.display = "flex";
    document.getElementById("modalTitle").innerText = type.toUpperCase() + " Logs";
    document.getElementById("recordType").value = type;
    currentType = type;
    resetForm();
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

// ====================== EDIT LOG ======================
function editLog(id, date, val1, val2) {
    document.getElementById("recordID").value = id;
    document.getElementById("logDate").value = date.split("T")[0];
    document.getElementById("value1").value = val1;
    document.getElementById("value2").value = val2 || "";
}

// ====================== UPDATE LOG ======================
async function saveLog(event) {
    event.preventDefault();
    const recordID = document.getElementById("recordID").value;
    const recordType = document.getElementById("recordType").value;
    const date = document.getElementById("logDate").value;
    const value1 = parseFloat(document.getElementById("value1").value);
    const value2 = document.getElementById("value2").value ? parseFloat(document.getElementById("value2").value) : null;

    const payload = { userID, recordType, value1, value2, recordedAt: date };

    try {
        const res = await fetch(`/api/healthRecords`, {
            method: "POST", // Backend handles add or update
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed to update log");

        alert("Log updated successfully!");
        resetForm();
        loadLogs(currentType);
        renderCharts();
    } catch (error) {
        console.error("Error updating log:", error);
    }
}

// ====================== DELETE LOG ======================
async function deleteLog(recordID) {
    if (confirm("Are you sure you want to delete this log?")) {
        try {
            const res = await fetch(`/api/healthRecords/${recordID}`, { method: "DELETE" });
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
                    zoom: {
                        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "xy" }
                    }
                }
            }
        });
    });
});

function closeChartModal() {
    chartModal.style.display = "none";
}

// ====================== INIT ======================
renderCharts();
