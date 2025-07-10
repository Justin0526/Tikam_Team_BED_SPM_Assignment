// TEMP until login is connected
const token = localStorage.getItem("token");

function getUserIdFromToken(token) {
  if (!token) return null;
  const payload = token.split('.')[1];
  try {
    const decoded = JSON.parse(atob(payload));
    return decoded.userID;
  } catch (e) {
    console.error("Invalid token:", e);
    return null;
  }
}

const loggedInUserID = getUserIdFromToken(token);

let appointments = [];
// let nextId = 1;
//   e.preventDefault();
//   const doctor = document.getElementById('doctorName').value;
//   const clinic = document.getElementById('clinicName').value;
//   const date = document.getElementById('appointmentDate').value;
//   const time = document.getElementById('appointmentTime').value;
//   const purpose = document.getElementById('purpose').value;

//   let reminder = reminderDate.value;
//   if (!reminder) {
//     const d = new Date(date);
//     d.setDate(d.getDate() - 1);
//     reminder = d.toISOString().split('T')[0];
//   }
//   const appointment = { id: nextId++, doctor, clinic, date, time, purpose, reminder };
//   appointments.push(appointment);
//   renderTable();
//   this.reset();

//   // Show success modal
//     document.getElementById('successModal').style.display = 'flex';



// });
let isEditing = false;//For edit form

function resetFormMode() {
  isEditing = false;
  document.getElementById('appointmentID').value = '';
  document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Appointment';

    document.getElementById('editButtons').style.display = 'none';
  document.getElementById('addButton').style.display = 'block';
//   document.getElementById('submitButton').textContent = 'Add Appointment';
//   document.getElementById('cancelEditButton').style.display = 'none';

}

// document.getElementById('appointment-form').addEventListener('submit', async function (e) {
// e.preventDefault();
// const rawReminder = document.getElementById('reminderDate').value;

// const appointment = {
//     userID: parseInt(document.getElementById('userID').value),
//     doctorName: document.getElementById('doctorName').value,
//     clinicName: document.getElementById('clinicName').value,
//     appointmentDate: document.getElementById('appointmentDate').value,
//     appointmentTime: document.getElementById('appointmentTime').value,
//     purpose: document.getElementById('purpose').value,
//     reminderDate: rawReminder === "" ? undefined : rawReminder//check if user does not input reminderDate, it will send undefined.Otherwise, it will send user inputted reminderDate
// };

// console.log("📤 Submitting appointment:", appointment); // Add for debugging
// try {
//     const response = await fetch('http://localhost:3000/appointments/user', {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(appointment)
//     });

//     const result = await response.json();

//     if (response.ok) {
//     document.getElementById('successModal').style.display = 'flex';
//     this.reset();
//     loadAppointments(appointment.userID);
//     } else {
//     alert("❌ Error: " + result.error);
//     // document.getElementById("errorBox").style.display = "block";
//     // document.getElementById("errorBox").innerText = result.error;
//     }
// } catch (err) {
//     console.error("❌ Network error:", err);
//     alert("❌ Failed to connect to the server.");
//     // document.getElementById("errorBox").style.display = "block";
//     // document.getElementById("errorBox").innerText = "Failed to connect to the server.";
// }
// });

document.getElementById('appointment-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const token = localStorage.getItem("token");
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

  // if(!isEditing){
  //   appointment.userID = loggedInUserID;
  // }

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

function searchAppointments() {
    const keyword = document.getElementById('searchKeyword').value.toLowerCase();
    const idFilter = document.getElementById('filterById').value;
    const dateFilter = document.getElementById('filterByDate').value;

    const body = document.getElementById('appointmentsBody');
    body.innerHTML = '';
    let found = false;

    for (let appt of appointments) {
    if ((keyword && !Object.values(appt).some(v => v.toString().toLowerCase().includes(keyword))) ||
        (idFilter && appt.id != idFilter) ||
        (dateFilter && appt.date !== dateFilter)) {
        continue;
    }
    found = true;
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${String(appt.id).padStart(2, '0')}</td>
        <td>${appt.doctor}</td>
        <td>${appt.clinic}</td>
        <td>${appt.date.split('-').reverse().join(' - ')}</td>
        <td>${appt.time}</td>
        <td>${appt.purpose}</td>
        <td class="actions">
        <span onclick="editAppointment(${appt.id})">⋮</span>
        </td>
    `;
    body.appendChild(row);
    }

    if (!found) {
    body.innerHTML = `
        <tr>
        <td colspan="7" style="text-align:center; padding: 20px; color: #888; font-style: italic;">No matching appointments found.</td>
        </tr>`;
    }
}

async function loadAppointments() {
    try {
    const token = localStorage.getItem("token");
    const response = await fetch(`http://localhost:3000/appointments/me`,{
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
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
            <td colspan="7" style="text-align:center; padding: 20px; color: #888; font-style: italic;">No appointments found for this user.</td>
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
    document.getElementById('appointmentsBody').innerHTML = `
        <tr><td colspan="7" style="text-align:center; color: red;">Error loading appointments.</td></tr>
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
//   // Change form to edit mode
//   document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Edit Appointment';
//   document.getElementById('submitButton').textContent = 'Save';
//   document.getElementById('cancelEditButton').style.display = 'inline-block';

}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

document.addEventListener("DOMContentLoaded", function () {
    if(!token | !loggedInUserID){
      alert("Please log in first.");
      window.location.href = "login.html";
      return;
    }
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