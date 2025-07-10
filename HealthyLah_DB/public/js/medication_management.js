function formatTime(timeString) {
  // parse the UTC‐based TIME value
  const d = new Date(timeString);
  // pull out the UTC hours/minutes (so no TZ shift)
  let h = d.getUTCHours();
  const m = d.getUTCMinutes();
  // compute AM/PM
  const ampm = h >= 12 ? "PM" : "AM";
  // convert to 12-hour clock
  h = h % 12 || 12;
  // zero-pad minutes
  const mm = String(m).padStart(2, "0");
  return `${h}:${mm} ${ampm}`;
}


async function loadTodayMeds() {
  try {
    const response = await fetch('http://localhost:3000/medications/today');
    if (!response.ok) throw new Error('Network error');
    
    const medications = await response.json();
    const tbody = document.getElementById('medication-table-body');
    tbody.innerHTML = '';

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
            : `<button class="mark-btn" data-id="${med.medicationID}"><i class="fas fa-check"></i> Mark Taken</button>`
          }
          <button class="menu-btn" data-id="${med.medicationID}"><i class="fas fa-ellipsis-v"></i></button>
        </td>
      `;
      tbody.appendChild(row);
    });

    attachMarkButtons();
  } catch (error) {
    console.error('Error loading medications:', error);
    showNotification('Failed to load medications');
  }
    attachMenuButtons();
}

function attachMarkButtons() {
  const buttons = document.querySelectorAll('.mark-btn:not(.disabled)');
  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');
      try {
        const res = await fetch(`http://localhost:3000/medications/${id}/mark-taken`, {
          method: 'PATCH'
        });
        if (res.ok) {
          showNotification('Medication marked as taken!');
          loadTodayMeds();
        } else {
          const errorText = await res.text();
          console.error('Server error:', errorText);
        }
      } catch (err) {
        console.error('Error updating medication:', err);
      }
    });
  });
}

function attachMenuButtons() {
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tr = btn.closest('tr');
      const id = btn.dataset.id;
      const name = tr.cells[1].textContent.trim();
      const dosage = tr.cells[2].textContent.trim();
      const timeText = tr.cells[0].textContent.trim(); // e.g. "2:30 PM"

      if (confirm(`Edit "${name}"?`)) {
        // populate the form for editing
        document.getElementById('med-name').value = name;
        document.getElementById('dosage').value  = dosage;

        // parse "2:30 PM" → "14:30" for the time input
        let [t, ampm] = timeText.split(' ');
        let [h, m]    = t.split(':').map(Number);
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        document.getElementById('time').value = 
          `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

        // scroll the form into view
        document.querySelector('.add-medication').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

window.addEventListener('DOMContentLoaded', function() {
  document.getElementById('start-date').valueAsDate = new Date();
  
  document.querySelector('.medication-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Get time input and add seconds
    const timeInput = document.getElementById('time').value;
    const formattedTime = timeInput ? `${timeInput}:00` : '';

    const payload = {
      userID: 1, // Hardcoded for demo - replace with actual user ID from session
      medicineName: document.getElementById('med-name').value,
      dosage: document.getElementById('dosage').value,
      frequency: document.getElementById('frequency').value,
      consumptionTime: formattedTime,
      startDate: document.getElementById('start-date').value,
      endDate: document.getElementById('end-date').value || null,
      notes: ''
    };

    try {
      const response = await fetch('http://localhost:3000/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  loadTodayMeds();
});