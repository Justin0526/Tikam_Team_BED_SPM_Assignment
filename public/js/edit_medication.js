// Wait for the DOM to finish loading before running the script
document.addEventListener("DOMContentLoaded", () => {
  // Get the medication ID from the query string (e.g., ?id=5)
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  // Populate the hidden field in the form with the medication ID
  document.getElementById('med-id').value = id;

  // Fetch the medication details from the backend
  fetch(`/medications/${id}`)
    .then(async r => {
      if (!r.ok) throw new Error(`Failed to fetch medication: ${r.status}`);
      const med = await r.json();

      console.log("Loaded medication:", med);
      console.log("Frequency from DB:", med.frequency);

      // Populate the form fields with data from the medication object
      const nameEl = document.getElementById('med-name');
      if (nameEl) nameEl.value = med.medicineName;

      const dosageEl = document.getElementById('dosage');
      if (dosageEl) dosageEl.value = med.dosage;

      const freqEl = document.getElementById('frequency');
      if (freqEl) {
        console.log("med.frequency =", med.frequency);
        console.log("options =", Array.from(freqEl.options).map(o => o.value));
        freqEl.value = med.frequency; // Pre-select the current frequency value
      }

      const timeEl = document.getElementById('time');
      if (timeEl && med.consumptionTime) {
        // Format the time string to HH:mm format for input type="time"
        const timeOnly = new Date(med.consumptionTime).toISOString().slice(11, 16); // "07:30"
        timeEl.value = timeOnly;
      }

      const startDateEl = document.getElementById('start-date');
      if (startDateEl && med.startDate) {
        // Trim the date string to YYYY-MM-DD format
        startDateEl.value = med.startDate.slice(0, 10);
      }

      const endDateEl = document.getElementById('end-date');
      if (endDateEl && med.endDate) {
        endDateEl.value = med.endDate.slice(0, 10);
      }

      const notesEl = document.getElementById('notes');
      if (notesEl) notesEl.value = med.notes || "";
    })
    .catch(err => {
      console.error("Error loading medication:", err);
      alert("Failed to load medication data. Check console.");
    });

  // Handle delete button click
  document.getElementById('delete-btn').addEventListener('click', async () => {
    if (confirm("Are you sure you want to delete this medication?")) {
      // Send a DELETE request to remove the medication
      const res = await fetch(`/medications/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert("Medication deleted.");
        // Redirect back to the medication management page
        location.href = '/html/medication_management.html';
      } else {
        alert("Failed to delete medication.");
      }
    }
  });

  // Handle form submission to update the medication
  document.getElementById('edit-form').addEventListener('submit', async e => {
    e.preventDefault(); // Prevent default form submission

    // Build the updated medication data from form inputs
    const payload = {
      medicineName:    document.getElementById('med-name').value,
      dosage:          document.getElementById('dosage').value,
      frequency:       document.getElementById('frequency').value,
      consumptionTime: document.getElementById('time').value + ':00', // Add seconds for backend format
      startDate:       document.getElementById('start-date').value,
      endDate:         document.getElementById('end-date').value || null,
      notes:           document.getElementById('notes')?.value || ""
    };

    // Send a PUT request to update the medication
    const res = await fetch(`/medications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('Saved!');
      location.href = '/html/medication_management.html'; // Redirect after saving
    } else {
      alert('Error saving');
    }
  });
});