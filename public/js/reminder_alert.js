// Name - Shein Wai Oo
// ID - 10269743C 
// ─── Reminder Alert Banner ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
  if (!token) return;

  try {
    const currentUser = await getToken(token);
    if (!currentUser) return;

    const response = await fetch("http://localhost:3000/appointments/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) return;
  
    const responseData = await response.json();
    // Support both response formats:
    // 1. A raw array: [ ... ]
    // 2. An object: { appointments: [ ... ] }
    const appointmentList = Array.isArray(responseData)
      ? responseData                     // raw array
      : responseData.appointments || []; // fallback to empty if undefined

    // Safety check: ensure we got a valid array
    if (!Array.isArray(appointmentList)) {
      console.warn("Reminder skipped: appointments is not an array", appointmentList);
      dismissReminderBanner();
      return;
    }

    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    // Filter only appointments that have a reminder for today
    const todaysReminders = appointmentList.filter(appt => {
      if (!appt.reminderDate) return false;
      const formatted = new Date(appt.reminderDate).toISOString().split("T")[0];
      return formatted === today;
    });

    //Show the banner (If reminders exist)
    if (todaysReminders.length > 0) {
      showReminderAlert(todaysReminders);
    }
  } catch (err) {
    console.error("Reminder error:", err);
  }
});

// Function to dismiss the reminder banner
function dismissReminderBanner() {
  const banner = document.getElementById("reminderBanner");
  if (banner) {
    banner.classList.remove("active"); // Slide out
    setTimeout(() => banner.remove(), 300); // Wait for animation to finish
    document.body.style.paddingTop = "0";
  }
}

//Function to show the reminder alert banner
function showReminderAlert(reminders) {
  const alertDiv = document.createElement("div");
  alertDiv.id = "reminderBanner";

  //Group reminders by appointment date
  const grouped = {};
  for (let appt of reminders) {
    const formattedDate = new Date(appt.appointmentDate).toLocaleDateString('en-GB');
    if (!grouped[formattedDate]) grouped[formattedDate] = [];
    grouped[formattedDate].push(appt.appointmentID);
  }

  //Generate links for each date
  const links = Object.entries(grouped).map(([date, ids]) => {
    return `<a href="appointment_management.html?scrollTo=${ids.join(',')}" class="appt-link">${date}</a>`;
  }).join(", ");

  //Handle plural form
  const plural = reminders.length === 1 ? "appointment" : "appointments";

  //Set banner HTML
  alertDiv.innerHTML = `
    <span class="close-banner" onclick="dismissReminderBanner()">✖</span>
    🔔 <strong>Reminder:</strong> You have ${reminders.length} ${plural} for ${links}.
  `;

  //Add banner to the top of the page
  document.body.prepend(alertDiv);
  document.body.style.paddingTop = "60px";

  //Animate banner in
  // 👉 Trigger the slide-in after rendering
  setTimeout(() => alertDiv.classList.add("active"), 10);
}

