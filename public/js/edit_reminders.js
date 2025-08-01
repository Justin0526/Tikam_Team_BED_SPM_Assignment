document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const token = localStorage.getItem("authToken");

  // Use getToken from auth.js for validation and profile rendering
  const user = await getToken(token);
  if (!user) {
    alert("You must be logged in to edit reminders.");
    window.location.href = "/html/login.html";
    return;
  }

  // GET the specific reminder
  try {
    const res = await fetch(`/reminders/${id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Failed to fetch reminder: ${res.status}`);
    const reminder = await res.json();
    console.log("Loaded reminder:", reminder);

    // Populate form fields
    document.getElementById('reminder-id').value = id;
    document.getElementById('reminder-name').value = reminder.title;
    document.getElementById('frequency').value = reminder.frequency;

    if (reminder.reminderTime) {
      const time = new Date(reminder.reminderTime);
      const hours = String(time.getUTCHours()).padStart(2, '0');
      const minutes = String(time.getUTCMinutes()).padStart(2, '0');
      document.getElementById('time').value = `${hours}:${minutes}`;
    }

    if (reminder.startDate) {
      document.getElementById('start-date').value = reminder.startDate.slice(0, 10);
    }

    if (reminder.endDate) {
      document.getElementById('end-date').value = reminder.endDate.slice(0, 10);
    }

    document.getElementById('notes').value = reminder.message || "";
  } catch (err) {
    console.error("Error loading reminder:", err);
    alert("Failed to load reminder data. Check console.");
  }

  // DELETE reminder
  document.getElementById('delete-btn').addEventListener('click', async () => {
    if (confirm("Are you sure you want to delete this reminder?")) {
      const res = await fetch(`/reminders/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        alert("Reminder deleted.");
        location.href = '/html/health_reminders.html';
      } else {
        alert("Failed to delete reminder.");
      }
    }
  });

  // UPDATE reminder
  document.getElementById('edit-form').addEventListener('submit', async e => {
    e.preventDefault();

    const payload = {
      title: document.getElementById('reminder-name').value,
      reminderTime: document.getElementById('time').value + ':00',
      frequency: document.getElementById('frequency').value,
      startDate: document.getElementById('start-date').value,
      endDate: document.getElementById('end-date').value || null,
      message: document.getElementById('notes')?.value || ""
    };

    const res = await fetch(`/reminders/${id}`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('Reminder updated!');
      location.href = '/html/health_reminders.html';
    } else {
      alert('Error updating reminder.');
    }
  });
});