document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  document.getElementById('med-id').value = id;

  // GET the specific medication
  fetch(`/medications/${id}`)
    .then(async r => {
      if (!r.ok) throw new Error(`Failed to fetch medication: ${r.status}`);
      const med = await r.json();

      console.log("💊 Loaded medication:", med);
      console.log("🔍 Frequency from DB:", med.frequency);

      const nameEl = document.getElementById('med-name');
      if (nameEl) nameEl.value = med.medicineName;

      const dosageEl = document.getElementById('dosage');
      if (dosageEl) dosageEl.value = med.dosage;

      const freqEl = document.getElementById('frequency');
      if (freqEl) {
        console.log("📦 med.frequency =", med.frequency);
        console.log("🎯 options =", Array.from(freqEl.options).map(o => o.value));
        freqEl.value = med.frequency;
      }

      const timeEl = document.getElementById('time');
      if (timeEl && med.consumptionTime) {
        const timeOnly = new Date(med.consumptionTime).toISOString().slice(11, 16); // "07:30"
        timeEl.value = timeOnly;
      }

      const startDateEl = document.getElementById('start-date');
      if (startDateEl && med.startDate) {
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
      console.error("❌ Error loading medication:", err);
      alert("Failed to load medication data. Check console.");
    });


  document.getElementById('delete-btn').addEventListener('click', async () => {
  if (confirm("Are you sure you want to delete this medication?")) {
    const res = await fetch(`/medications/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      alert("Medication deleted.");
      location.href = '/html/medication_management.html';
    } else {
      alert("Failed to delete medication.");
    }
  }
  });

  document.getElementById('edit-form').addEventListener('submit', async e => {
    e.preventDefault();

    const payload = {
      medicineName: document.getElementById('med-name').value,
      dosage:       document.getElementById('dosage').value,
      frequency:    document.getElementById('frequency').value,
      consumptionTime: document.getElementById('time').value + ':00',
      startDate:    document.getElementById('start-date').value,
      endDate:      document.getElementById('end-date').value || null,
      notes:        document.getElementById('notes')?.value || ""
    };

    const res = await fetch(`/medications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('Saved!');
      location.href = '/html/medication_management.html';
    } else {
      alert('Error saving');
    }
  });
});