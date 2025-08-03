// Khaleel Anis S10270243D

// Base URL for API calls — change this if deploying to a live server
window.apiBaseURL = window.apiBaseURL || 'http://localhost:3000';

// grab the JWT and build headers
const authHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

/**
 * Converts a UTC time string to 12-hour AM/PM format for display.
 * @param {string} timeString - A UTC time string (e.g. "13:30:00").
 * @returns {string} - A string in 12-hour format with AM/PM (e.g. "1:30 PM").
 */
function formatTime(timeString) {
  const d = new Date(timeString);

  // getUTCHours() returns the hour (0–23) in UTC time zone
  let h = d.getUTCHours();

  // getUTCMinutes() returns the minute (0–59) in UTC time zone
  const m = d.getUTCMinutes();

  // AM or PM based on the hour
  const ampm = h >= 12 ? "PM" : "AM";

  // Convert 24-hour format to 12-hour format (0 becomes 12)
  h = h % 12 || 12;

  // padStart ensures minutes like "2" become "02"
  const mm = String(m).padStart(2, "0");

  return `${h}:${mm} ${ampm}`;
}

/**
 * Loads the list of medications scheduled for today from the server.
 * Populates the medication table with the returned data.
 * Also attaches the event handlers for mark and menu buttons.
 */
async function loadTodayMeds() {
  const todayHeader = document.getElementById('today-header');
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-SG', options);
  todayHeader.textContent = `Today's Medication — ${formattedDate}`;

  try {
    const response = await fetch(`${apiBaseURL}/medications/today`, {headers:authHeaders});
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    
    const medications = await response.json();
    const tbody = document.getElementById('medication-table-body');
    tbody.innerHTML = ''; // Clear existing rows
    medications.sort((a, b) => {
      return a.consumptionTime.localeCompare(b.consumptionTime);
    });
    // Create table rows for each medication
    medications.forEach(med => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><i class="fas fa-clock"></i> ${formatTime(med.consumptionTime)}</td>
        <td>${med.medicineName}</td>
        <td>${med.dosage}</td>
        <td class="status ${med.status === 'Taken' ? 'taken' : 'not-yet'}">
          ${med.status || 'Not Yet'}
        </td>
        <td>
          ${med.status === 'Taken' 
            ? `<button class="mark-btn disabled" disabled><i class="fas fa-check"></i> Taken</button>` 
            : `<button class="mark-btn" data-id="${med.medicationID}"><i class="fas fa-check"></i> Mark Taken</button>`}
          <button class="menu-btn" data-id="${med.medicationID}"><i class="fas fa-ellipsis-v"></i></button>
        </td>
      `;
      tbody.appendChild(row);
    });

    attachMarkButtons();  // Activate mark buttons
  } catch (error) {
    console.error('Error loading medications:', error);
    showNotification('Failed to load medications – please try again later.');
  }

  attachMenuButtons();  // Activate menu buttons (edit)
}

/**
 * Attaches click event listeners to "Mark Taken" buttons.
 * On click, it sends a PUT request to update the medication status.
 */
function attachMarkButtons() {
  const buttons = document.querySelectorAll('.mark-btn:not(.disabled)');
  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');
      const row = button.closest('tr');

      try {
        const res = await fetch(`${apiBaseURL}/medications/${id}/mark-taken`, {
          method: 'PUT',
          headers: authHeaders
        });

        if (res.ok) {
          showNotification('Medication marked as taken!');
          
          // Add fade-out animation then remove the row
          row.classList.add('fade-out');
          setTimeout(() => {
            row.remove(); // wait for 0.5s to match animation
            loadUpcomingMeds();
          }, 500);
        } else {
          const errorText = await res.text();
          console.error('Server error:', errorText);
          showNotification(`Error marking as taken: ${errorText}`);
        }
      } catch (err) {
        console.error('Error updating medication:', err);
        showNotification('Network error – could not mark as taken.');
      }
    });
  });
}

/**
 * Attaches event listeners to each edit (menu) button.
 * On click, it pre-fills the medication form with the selected row data.
 * Then redirects to the edit page with the medication ID in the URL.
 */
function attachMenuButtons() {
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tr = btn.closest('tr');
      const id = btn.dataset.id;
      const name = tr.cells[1].textContent.trim();
      const dosage = tr.cells[2].textContent.trim();
      const timeText = tr.cells[0].textContent.trim(); // e.g. "2:30 PM"

      if (confirm(`Edit "${name}"?`)) {
        // Fill form fields with selected medication details
        document.getElementById('med-name').value = name;
        document.getElementById('dosage').value  = dosage;

        // Convert 12-hour format to 24-hour format for time input
        let [t, ampm] = timeText.split(' ');
        let [h, m]    = t.split(':').map(Number);
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        document.getElementById('time').value = 
          `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

        // Navigate to the edit page with the medication ID
        window.location.href = `edit_medication.html?id=${id}`;
      }
    });
  });
}

async function loadUpcomingMeds() {
  try {
    const res = await fetch(`${apiBaseURL}/medications/upcoming`, {headers:authHeaders});
    const data = await res.json();

    const tbody = document.querySelector('.reminder-table tbody');
    tbody.innerHTML = '';

    if (data.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="3" style="text-align:center;">No medication in the next hour.</td>`;
      tbody.appendChild(row);
      return;
    }

    data.forEach(med => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><i class="fas fa-clock"></i> ${formatTime(med.consumptionTime)}</td>
        <td>${med.medicineName}</td>
        <td>${med.dosage}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading upcoming medications:", err);
  }
}

/**
 * Displays a floating notification.
 * @param {string} message - The message to show.
 * @param {string} type - 'success' (default) or 'error'
 */
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  const icon =
    type === "error"
      ? `<i class="fas fa-times-circle"></i>` // Red cross for error
      : `<i class="fas fa-check-circle"></i>`; // Green check for success

  notification.innerHTML = `${icon} ${message}`;
  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add("show"), 10);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

/**
 * Sets up event listeners and default values when the DOM is ready.
 * - Sets default start date to today.
 * - Handles medication form submission.
 * - Loads today's medications.
 */
window.addEventListener('DOMContentLoaded', async function() {
  const user = await getToken(token);
  if (!user) return this.window.location.href = 'login.html';

  document.getElementById('start-date').valueAsDate = new Date();

  document.querySelector('.medication-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const today = new Date().setHours(0, 0, 0, 0);
    const startDate = new Date(document.getElementById('start-date').value).setHours(0, 0, 0, 0);
    const endDateInput = document.getElementById('end-date').value;
    const endDate = endDateInput ? new Date(endDateInput).setHours(0, 0, 0, 0) : null;

    // Validate dates
    if (startDate < today) {
      showNotification("Start date cannot be in the past.", "error");
      return;
    }
    if (endDate && endDate < today) {
      showNotification("End date cannot be in the past.", "error");
      return;
    }
    if (endDate && endDate < startDate) {
      showNotification("End date cannot be earlier than start date.", "error");
      return;
    }

    // Proceed if dates are valid
    const timeInput = document.getElementById('time').value;
    const formattedTime = timeInput ? `${timeInput}:00` : '';

    const payload = {
      medicineName: document.getElementById('med-name').value,
      dosage: document.getElementById('dosage').value,
      frequency: document.getElementById('frequency').value,
      consumptionTime: formattedTime,
      startDate: document.getElementById('start-date').value,
      endDate: endDateInput || null,
      notes: ''
    };

    try {
      const response = await fetch(`${apiBaseURL}/medications`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showNotification('Medication saved to database!');
        this.reset();
        document.getElementById('start-date').valueAsDate = new Date();
        loadTodayMeds();
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        showNotification(`Failed to save: ${errorText}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      showNotification('Network error - try again');
    }
  });

  loadTodayMeds(); // Initial load of today's medications
  loadUpcomingMeds();
  setInterval(loadUpcomingMeds, 60 * 60 * 1000); // reload every hour
});