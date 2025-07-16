// 1) read ?id=…
const params = new URLSearchParams(location.search);
const id = params.get('id');
document.getElementById('med-id').value = id;

// 2) fetch the current data
fetch(`/medications/today`)
    .then(r=>r.json())
    .then(list=>{
    const med = list.find(m=>String(m.medicationID)===id);
    if (!med) return alert('Not found');
    document.getElementById('med-name').value = med.medicineName;
    document.getElementById('dosage').value  = med.dosage;
    document.getElementById('frequency').value = med.frequency;
    // consumptionTime is "HH:mm" or "HH:mm:SS"
    document.getElementById('time').value = med.consumptionTime.slice(0,5);
    document.getElementById('start-date').value = med.startDate.slice(0,10);
    if (med.endDate) document.getElementById('end-date').value = med.endDate.slice(0,10);
    });

// 3) on submit, PATCH back
document.getElementById('edit-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const payload = {
    medicineName: document.getElementById('med-name').value,
    dosage:       document.getElementById('dosage').value,
    frequency:    document.getElementById('frequency').value,
    consumptionTime: document.getElementById('time').value + ':00',
    startDate:    document.getElementById('start-date').value,
    endDate:      document.getElementById('end-date').value || null,
    notes:        ''
    };
    const res = await fetch(`/medications/${id}`, {
    method: 'PATCH',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
    });
    if (res.ok) {
    alert('Saved!');
    location.href = '/medication_management.html';
    } else {
    alert('Error saving');
    }
}); 