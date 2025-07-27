const apiBaseUrl = "http://localhost:3000";
let userToken = localStorage.getItem("authToken");

document.addEventListener("DOMContentLoaded", async () => {
  const user = await getToken(userToken);
  if (!user) return;

  loadReminders(userToken);
  document.querySelector(".reminders-form").addEventListener("submit", (e) => {
    handleAddReminder(e, userToken);
  });
});

function formatTime(time) {
  let hour, minute;

  if (typeof time === "string" && time.includes("T")) {
    const date = new Date(time);
    hour = date.getUTCHours(); // use UTC to avoid timezone shifts
    minute = date.getUTCMinutes();
  } else if (typeof time === "string") {
    [hour, minute] = time.split(":").map(Number);
  } else {
    return "Invalid";
  }

  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  const paddedMin = String(minute).padStart(2, "0");

  return `${hour12}:${paddedMin} ${ampm}`;
}

async function loadReminders(token) {
  try {
    const res = await fetch(`${apiBaseUrl}/reminders`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to load reminders");

    const reminders = await res.json();

    const activeBody = document.getElementById("reminders-table-body");
    const upcomingBody = document.getElementById("upcoming-reminders-body");
    activeBody.innerHTML = "";
    upcomingBody.innerHTML = "";

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // compare only dates

    reminders.forEach(r => {
      const timeStr = formatTime(r.reminderTime);

      const actionButtons = `
        ${r.status === 'Taken'
          ? `<button class="mark-btn disabled" disabled><i class="fas fa-check"></i> Taken</button>`
          : `<button class="mark-btn" data-id="${r.reminder_id}"><i class="fas fa-check"></i> Mark Taken</button>`
        }
        <button class="menu-btn" data-id="${r.reminder_id}" data-title="${r.title}">
          <i class="fas fa-ellipsis-v"></i>
        </button>
      `;

      const row = `
        <tr>
          <td><i class="fas fa-clock"></i> ${timeStr}</td>
          <td>${r.title}</td>
          <td>${r.frequency}</td>
          <td>${r.message || ""}</td>
          <td>${actionButtons}</td>
        </tr>
      `;

      const start = new Date(r.startDate);
      const end = r.endDate ? new Date(r.endDate) : null;

      start.setHours(0, 0, 0, 0);
      if (end) end.setHours(0, 0, 0, 0);

      if (start <= currentDate && (!end || end >= currentDate)) {
        activeBody.innerHTML += row;
      } else {
        upcomingBody.innerHTML += row;
      }
    });

    attachReminderMenuButtons();
    attachMarkButtons();
  } catch (err) {
    console.error("Error loading reminders:", err);
  }
}

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
          loadReminders(userToken); // reload updated status
        } else {
          const text = await res.text();
          console.error(text);
          alert("Failed to mark as taken");
        }
      } catch (err) {
        console.error("Error:", err);
        alert("Network error");
      }
    });
  });
}

async function handleAddReminder(e, token) {
  e.preventDefault();

  const title = document.getElementById("reminder-name").value.trim();
  const timeInput = document.getElementById("time").value;
  const reminderTime = timeInput.length === 5 ? `${timeInput}:00` : timeInput || null;
  console.log("⏰ reminderTime being sent:", reminderTime);
  const frequency = document.getElementById("frequency").value;
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value || null;
  const message = document.getElementById("notes").value.trim() || null;

   const payload = {
    title,
    reminderTime,
    frequency,
    message,
    startDate,
    endDate
  };

  console.log("📦 Sending reminder payload:", payload);
  console.log("✅ Final reminderTime sent:", reminderTime);
  try {
    const res = await fetch(`${apiBaseUrl}/reminders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Failed to create reminder");
    }

    alert("Reminder added successfully!");
    document.querySelector(".reminders-form").reset();
    loadReminders(token);
  } catch (err) {
    console.error("Error creating reminder:", err);
    alert("Failed to add reminder.");
  }
}

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