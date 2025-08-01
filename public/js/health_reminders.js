const apiBaseUrl = "http://localhost:3000";
let userToken = localStorage.getItem("authToken");

document.addEventListener("DOMContentLoaded", async () => {
  const user = await getToken(userToken);
  if (!user) return;

  // Auto-fill the start date field with today's date
  const startDateInput = document.getElementById("start-date");
  if (startDateInput) {
    startDateInput.valueAsDate = new Date(); // auto-fills with today's date
  }

  loadReminders(userToken);          // Load today's reminders
  loadUpcomingReminders();           // Load upcoming reminders
  document.querySelector(".reminders-form").addEventListener("submit", (e) => {
    handleAddReminder(e, userToken);
  });
});

function formatTime(time) {
  // Handle "HH:mm:ss" or full ISO datetime strings
  if (time.includes("T")) {
    const parts = time.split("T")[1].split(":");
    let hour = parseInt(parts[0]);
    const minute = parseInt(parts[1]);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${String(minute).padStart(2, "0")} ${ampm}`;
  } else {
    const [hourStr, minuteStr] = time.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${String(minute).padStart(2, "0")} ${ampm}`;
  }
}

/**
 * Loads today's reminders (Active Reminders section).
 */
async function loadReminders(token) {
  try {
    // Set header date
    const todayHeader = document.getElementById("today-header");
    const today = new Date();
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    todayHeader.textContent = `Today's Reminders - ${today.toLocaleDateString('en-GB', options)}`;

    // Fetch reminders
    const res = await fetch(`${apiBaseUrl}/reminders`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.status === 401) {
      alert("Session expired. Please log in again.");
      return;
    }

    if (!res.ok) throw new Error(`Failed to load reminders: ${res.status}`);
    let reminders = await res.json();

    const activeBody = document.getElementById("reminders-table-body");
    activeBody.innerHTML = "";

    if (!Array.isArray(reminders) || reminders.length === 0) {
      console.warn("No reminders returned from API.");
      return;
    }

    // Sort by time and filter today's active reminders
    const now = new Date();
    const currentDate = new Date(now);
    currentDate.setHours(0, 0, 0, 0);

    reminders.sort((a, b) => a.reminderTime.localeCompare(b.reminderTime));

    reminders.forEach(r => {
      if (r.status !== "Taken") {
        const start = new Date(r.startDate);
        const end = r.endDate ? new Date(r.endDate) : null;
        start.setHours(0, 0, 0, 0);
        if (end) end.setHours(0, 0, 0, 0);

        if (start <= currentDate && (!end || end >= currentDate)) {
          const timeStr = formatTime(r.reminderTime);
          activeBody.innerHTML += generateReminderRow(r, timeStr);
        }
      }
    });

  } catch (err) {
    console.error("Error loading reminders:", err);
  }
}

/**
 * Loads upcoming reminders in the next hour (Upcoming Reminders section).
 */
async function loadUpcomingReminders() {
  try {
    const res = await fetch(`${apiBaseUrl}/reminders/upcoming`, {
      headers: { "Authorization": `Bearer ${userToken}` }
    });

    const upcomingBody = document.getElementById("upcoming-reminders-body");
    upcomingBody.innerHTML = "";

    if (!res.ok) {
      console.error("Failed to fetch upcoming reminders:", res.status);
      upcomingBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Error loading upcoming reminders.</td></tr>`;
      return;
    }

    const data = await res.json();
    if (!data || data.length === 0) {
      upcomingBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No upcoming reminders in the next hour.</td></tr>`;
      return;
    }

    data.forEach(r => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><i class="fas fa-clock"></i> ${formatTime(r.reminderTime)}</td>
        <td>${r.title}</td>
        <td>${r.frequency}</td>
        <td>${r.message || ""}</td>
      `;
      upcomingBody.appendChild(row);
    });

    attachReminderMenuButtons();
    attachMarkButtons();
  } catch (err) {
    console.error("Error loading upcoming reminders:", err);
  }
}

/**
 * Generates HTML row for a reminder.
 */
function generateReminderRow(r, timeStr) {
  return `
    <tr>
      <td><i class="fas fa-clock"></i> ${timeStr}</td>
      <td>${r.title}</td>
      <td>${r.frequency}</td>
      <td>${r.message || ""}</td>
      <td>
        ${r.status === "Taken"
          ? `<button class="mark-btn disabled" disabled><i class="fas fa-check"></i> Taken</button>`
          : `<button class="mark-btn" data-id="${r.reminder_id}"><i class="fas fa-check"></i> Mark Taken</button>`
        }
        <button class="menu-btn" data-id="${r.reminder_id}" data-title="${r.title}">
          <i class="fas fa-ellipsis-v"></i>
        </button>
      </td>
    </tr>
  `;
}

/**
 * Attach menu button actions.
 */
function attachReminderMenuButtons() {
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const title = btn.dataset.title;
      if (confirm(`Edit reminder "${title}"?`)) {
        window.location.href = `edit_reminders.html?id=${id}`;
      }
    });
  });
}

/**
 * Attach "Mark Taken" button actions.
 */
function attachMarkButtons() {
  document.querySelectorAll('.mark-btn:not(.disabled)').forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;

      try {
        const res = await fetch(`${apiBaseUrl}/reminders/${id}/mark-taken`, {
          method: 'PUT',
          headers: {
            "Authorization": `Bearer ${userToken}`,
            "Content-Type": "application/json"
          }
        });

        if (res.ok) {
          showNotification("Reminder marked as taken!");
          const row = button.closest("tr");
          if (row) row.remove();
          loadUpcomingReminders(); // Refresh upcoming section
        } else {
          alert("Failed to mark as taken");
        }
      } catch (err) {
        console.error("Error:", err);
        alert("Network error");
      }
    });
  });
}

/**
 * Handles adding a new reminder.
 */
async function handleAddReminder(e, token) {
  e.preventDefault();

  const title = document.getElementById("reminder-name").value.trim();
  const timeInput = document.getElementById("time").value;
  const reminderTime = timeInput.length === 5 ? `${timeInput}:00` : timeInput || null;
  const frequency = document.getElementById("frequency").value;
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value || null;
  const message = document.getElementById("notes").value.trim() || null;

  const payload = { title, reminderTime, frequency, message, startDate, endDate };

  try {
    const res = await fetch(`${apiBaseUrl}/reminders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Failed to create reminder");

    alert("Reminder added successfully!");
    document.querySelector(".reminders-form").reset();
    loadReminders(token);
    loadUpcomingReminders();
  } catch (err) {
    console.error("Error creating reminder:", err);
    alert("Failed to add reminder.");
  }
}

/**
 * Displays a floating notification.
 */
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add("show"), 10);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}