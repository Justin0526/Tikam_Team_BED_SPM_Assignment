    // Mark as taken functionality
document.querySelectorAll('.mark-btn').forEach(button => {
    button.addEventListener('click', function() {
        const row = this.closest('tr');
        const statusCell = row.querySelector('.status');
                
        if (statusCell.classList.contains('not-yet')) {
            statusCell.textContent = 'Taken';
            statusCell.classList.remove('not-yet');
            statusCell.classList.add('taken');
                    
            // Change button to disabled state
            this.innerHTML = '<i class="fas fa-check"></i> Taken';
            this.disabled = true;
            this.classList.add('disabled');
                    
            // Show confirmation
            showNotification('Medication marked as taken!');
        }
    });
});
        
// Form submission
document.querySelector('.medication-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const payload = {
    medicineName: document.getElementById('med-name').value,
    dosage: document.getElementById('dosage').value,
    frequency: document.getElementById('frequency').value,
    consumptionTime: document.getElementById('time').value,
    startDate: document.getElementById('start-date').value,
    endDate: document.getElementById('end-date').value || null,
    notes: ''
  };

  const response = await fetch('http://localhost:3000/medications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    showNotification('Medication saved to database!');
    this.reset();
    loadTodayMeds(); // Reload medications after saving
  } else {
    showNotification('Failed to save medication.');
  }
});

function formatTime(timeString) {
  return timeString ? timeString.slice(0, 5) : '';
}

async function loadTodayMeds() {
  try {
    const response = await fetch('http://localhost:3000/medications/today');
    if (!response.ok) throw new Error('Network error');
    
    const medications = await response.json();
    const tbody = document.getElementById('medication-table-body');
    tbody.innerHTML = '';

    // Use the global formatTime function
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
        </td>
      `;
      tbody.appendChild(row);
    });

    attachMarkButtons();
  } catch (error) {
    console.error('Error loading medications:', error);
    showNotification('Failed to load medications');
  }
}

function formatTime(timeString) {
  // Returns HH:mm from full time (e.g. "14:30:00.000Z")
  return timeString.slice(0, 5);
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
        }
      } catch (err) {
        console.error('Error updating medication:', err);
      }
    });
  });
}

window.addEventListener('DOMContentLoaded', loadTodayMeds);
            
// Set default start date to today
document.getElementById('start-date').valueAsDate = new Date();
        
// Show notification function
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(notification);
            
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
            
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Set default start date to today
document.getElementById('start-date').valueAsDate = new Date();