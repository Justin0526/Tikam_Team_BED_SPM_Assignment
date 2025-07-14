let currentUser = null;
let appointments = [];
let isEditing = false;//For edit form

//Debugging
console.log("Current User:", currentUser);

function resetFormMode() {
  isEditing = false;
  document.getElementById('appointmentID').value = '';
  document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Appointment';
  document.getElementById('editButtons').style.display = 'none';
  document.getElementById('addButton').style.display = 'block';
}

// Handle form submission for creating or updating appointments
document.getElementById('appointment-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  if(!token){
    alert("You must be logged in to create or update appointments.");
    return;
  }
  const rawReminder = document.getElementById('reminderDate').value;
  const appointmentID = document.getElementById('appointmentID').value;

  const appointment = {
    doctorName: document.getElementById('doctorName').value,
    clinicName: document.getElementById('clinicName').value,
    appointmentDate: document.getElementById('appointmentDate').value,
    appointmentTime: document.getElementById('appointmentTime').value,
    purpose: document.getElementById('purpose').value,
    reminderDate: rawReminder === "" ? undefined : rawReminder
  };

  try {
    let response;
    if (isEditing) {
      // PUT: update appointment
      response = await fetch(`http://localhost:3000/appointments/${appointmentID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(appointment)
      });
    } else {
      // POST: create new appointment
      response = await fetch('http://localhost:3000/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
         },
        body: JSON.stringify(appointment)
      });
    }

    const result = await response.json();

    if (response.ok) {
      document.getElementById('successModal').style.display = 'flex';
      this.reset();
      resetFormMode();
      loadAppointments();
    } else {
      alert("❌ Error: " + result.error);
    }
  } catch (err) {
    console.error("❌ Network error:", err);
    alert("❌ Failed to connect to the server.");
  }
});

function renderTable() {
    const body = document.getElementById('appointmentsBody');
    body.innerHTML = '';
    if (appointments.length === 0) {
    body.innerHTML = `
        <tr id="emptyState">
        <td colspan="7" style="text-align:center; padding: 20px; color: #888; font-style: italic;">No appointments yet. Add one above to get started.</td>
        </tr>`;
    return;
    }
    for (let appt of appointments) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${String(appt.id).padStart(2, '0')}</td>
        <td>${appt.doctor}</td>
        <td>${appt.clinic}</td>
        <td>${appt.date.split('-').reverse().join(' - ')}</td>
        <td>${appt.time}</td>
        <td>${appt.purpose}</td>
        <td>${appt.reminderDate ? appt.reminderDate.split('-').reverse().join(' - ') : '-'}</td>
        <td class="actions">
            <div class="dropdown-container">
                <span class="dropdown-trigger">⋮</span>
                <div class="dropdown-menu" style="display: none;">
                    <div class="dropdown-item" onclick="editAppointment(${appt.appointmentID})">Edit</div>
                    <div class="dropdown-item" onclick="deleteAppointment(${appt.appointmentID})">Delete</div>
                </div>
            </div>
        </td>

        <span onclick="editAppointment(${appt.id})">⋮</span>
        </td>
    `;
    body.appendChild(row);
    }
}

async function loadAppointments() {
    try {
    const response = await fetch(`http://localhost:3000/appointments/me`,{
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    //Handle 401 Unauthorized separately
    if(response.status === 401) {
      document.getElementById('appointmentsBody').innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; color: red;">
            Session expired. Please <a href="login.html">log in again</a>.
          </td>
        </tr>
      `;
      return;
    }
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Failed to load appointments");
    }
    appointments = data;
    // Clear table body
    const body = document.getElementById('appointmentsBody');
    body.innerHTML = '';

    if (data.length === 0) {
        body.innerHTML = `
        <tr id="emptyState">
            <td colspan="8" style="text-align:center; padding: 20px; color: #888; font-style: italic;">No appointments added yet.</td>
        </tr>`;
        return;
    }

    data.forEach(appt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${String(appt.appointmentID).padStart(2, '0')}</td>
            <td>${appt.doctorName}</td>
            <td>${appt.clinicName}</td>
            <td>${appt.appointmentDate.split('-').reverse().join(' - ')}</td>
            <td>${appt.appointmentTime}</td>
            <td>${appt.purpose}</td>
            <td>${appt.reminderDate ? appt.reminderDate.split('-').reverse().join(' - ') : '-'}</td>
            <td class="actions">
                <div class="dropdown-container">
                    <span class="dropdown-trigger">⋮</span>
                    <div class="dropdown-menu" style="display: none;">
                        <div class="dropdown-item" onclick="editAppointment(${appt.appointmentID})">Edit</div>
                        <div class="dropdown-item" onclick="deleteAppointment(${appt.appointmentID})">Delete</div>
                    </div>
                </div>
            </td>
        `;
        body.appendChild(row);
    });
    } 
    catch (err) {
    console.error("❌ Failed to load appointments:", err);
    // document.getElementById('appointmentsBody').innerHTML = `
    //     <tr><td colspan="7" style="text-align:center; color: red;">Error loading appointments.</td></tr>
    // `;
    document.getElementById('appointmentsBody').innerHTML = `
    <tr><td colspan="8" style="text-align:center; color: red; font-weight: bold;">
        ⚠️ Failed to connect to the server. Please try again later.
    </td></tr>
    `;

    }
}

function editAppointment(id) {
  const appt = appointments.find(a => a.appointmentID === id);

  if (!appt) {
    alert("Appointment not found.");
    return;
  }

  // Fill form fields
  document.getElementById('appointmentID').value = appt.appointmentID;
  document.getElementById('doctorName').value = appt.doctorName;
  document.getElementById('clinicName').value = appt.clinicName;
  document.getElementById('appointmentDate').value = appt.appointmentDate;
  document.getElementById('appointmentTime').value = appt.appointmentTime;
  document.getElementById('purpose').value = appt.purpose;
  document.getElementById('reminderDate').value = appt.reminderDate || "";

  // Switch button mode
  document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Edit Appointment';
  document.getElementById('editButtons').style.display = 'flex';
  document.getElementById('addButton').style.display = 'none';
  isEditing = true;
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

document.addEventListener("DOMContentLoaded", async function () {
    currentUser = await getToken(token);
    loadAppointments();

    document.getElementById('cancelEditButton').addEventListener('click', function () {
    document.getElementById('appointment-form').reset();
    resetFormMode();
  });

});

//The box where there are two options: edit and delete will pop up here
document.addEventListener("click", function (e) {
  const allMenus = document.querySelectorAll(".dropdown-menu");

  // If user clicks on ⋮ icon
  if (e.target.classList.contains("dropdown-trigger")) {
    const menu = e.target.nextElementSibling;
    allMenus.forEach(m => {
      if (m !== menu) m.style.display = "none";
    });
    menu.style.display = menu.style.display === "block" ? "none" : "block";
    e.stopPropagation(); // prevent from bubbling to document
  } else {
    allMenus.forEach(m => m.style.display = "none");
  }
});