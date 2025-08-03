// Khaleel Anis S10270243D

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const token = localStorage.getItem("authToken");

  // Validate token and render profile using getToken from auth.js
  const user = await getToken(token);
  if (!user) {
    alert("You must be logged in to edit medications.");
    window.location.href = "/html/login.html";
    return;
  }

  // Populate the hidden field in the form with the medication ID
  document.getElementById('med-id').value = id;

  // Fetch the medication details securely
  try {
    const res = await fetch(`/medications/${id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Failed to fetch medication: ${res.status}`);
    const med = await res.json();

    console.log("Loaded medication:", med);

    // Populate the form fields
    document.getElementById('med-name').value = med.medicineName || "";
    document.getElementById('dosage').value = med.dosage || "";
    document.getElementById('frequency').value = med.frequency || "Daily";

    if (med.consumptionTime) {
      const timeOnly = new Date(med.consumptionTime).toISOString().slice(11, 16); // HH:mm
      document.getElementById('time').value = timeOnly;
    }

    if (med.startDate) {
      document.getElementById('start-date').value = med.startDate.slice(0, 10);
    }

    if (med.endDate) {
      document.getElementById('end-date').value = med.endDate.slice(0, 10);
    }

    const notesEl = document.getElementById('notes');
    if (notesEl) notesEl.value = med.notes || "";
  } catch (err) {
    console.error("Error loading medication:", err);
    alert("Failed to load medication data. Check console.");
  }

  // Handle delete button
  document.getElementById('delete-btn').addEventListener('click', async () => {
    if (confirm("Are you sure you want to delete this medication?")) {
      const res = await fetch(`/medications/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        alert("Medication deleted.");
        location.href = '/html/medication_management.html';
      } else {
        alert("Failed to delete medication.");
      }
    }
  });

  // Handle form submission (update medication)
  document.getElementById('edit-form').addEventListener('submit', async e => {
    e.preventDefault();

    const payload = {
      medicineName: document.getElementById('med-name').value,
      dosage: document.getElementById('dosage').value,
      frequency: document.getElementById('frequency').value,
      consumptionTime: document.getElementById('time').value + ':00',
      startDate: document.getElementById('start-date').value,
      endDate: document.getElementById('end-date').value || null,
      notes: document.getElementById('notes')?.value || ""
    };

    const res = await fetch(`/medications/${id}`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('Medication updated!');
      location.href = '/html/medication_management.html';
    } else {
      alert('Error updating medication.');
    }
  });
});