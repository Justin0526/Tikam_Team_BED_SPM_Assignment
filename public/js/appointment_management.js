const apiBaseUrl = "http://localhost:3000";
let currentUser = null;
let appointments = [];
let isEditing = false;//For edit form
let pendingDeleteID = null;

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
  if(!currentUser || currentUser === null) {
    alert("You must be logged in to create or update appointments.");
    return;
  }
  const rawReminder = document.getElementById('reminderDate').value;
  const appointmentID = document.getElementById('appointmentID').value;

  //Collect all input field values and creates a JavaScript object
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
      response = await fetch(`${apiBaseUrl}/appointments/${appointmentID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(appointment)
      });
    } else {
      // POST: create new appointment
      response = await fetch(`${apiBaseUrl}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
         },
        body: JSON.stringify(appointment)
      });
    }

    const result = await response.json();

    if (response.ok) {
      showSuccessModal("Appointment added successfully!");
      this.reset();//Reset form fields
      resetFormMode();// Switch form to "Add" mode
      loadAppointments();//Refresh table
      updateReminderBanner(); // Update the top reminder if needed
    } else {
      alert("❌ Error: " + result.error);
    }
  } catch (err) {
    console.error("❌ Network error:", err);
    alert("❌ Failed to connect to the server.");
  }
});

// ─── Render Tables ─────────────────────────────────────────────────────────────────────
function renderTable() {
    const body = document.getElementById('appointmentsBody');
    body.innerHTML = '';

    //If there are no appointments, it inserts a message row to indicate
    //that the table is empty.
    if (appointments.length === 0) {
    body.innerHTML = `
        <tr id="emptyState">
        <td colspan="7" style="text-align:center; padding: 20px; color: #888; font-style: italic;">No appointments yet. Add one above to get started.</td>
        </tr>`;
    return;
    }

    //Loops through the appointments array
    //For each appt, creates a new <tr> row
    //Sets its ID to something like appt-12 (for scroll targeting)
    for (let appt of appointments) {
    const row = document.createElement('tr');
    row.id = `appt-${appt.appointmentID}`;  // Mark row with appointmentID to allow scrolling from banner
    //Fill in the row with data
    row.innerHTML = `
        <td>${appt.purpose}</td>
        <td>${appt.appointmentDate.split('-').reverse().join(' - ')}</td>
        <td>${appt.appointmentTime}</td>
        <td>${appt.doctorName}</td>
        <td>${appt.clinicName}</td>
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
    `;// Creates a three-dot dropdown menu 
    body.appendChild(row);
    //Finally, the completed <tr> is added to the the <tbody> so it appears in the UI.
    }
}

// ─── Load Appointments ─────────────────────────────────────────────────────────────────────
async function loadAppointments() {
    try {
      const response = await fetch(`${apiBaseUrl}/appointments/me`,{
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
      renderTable();
      
      //Scroll to specific appointment if scrollTo parameter is present
      const scrollParam = new URLSearchParams(window.location.search).get("scrollTo");//Check the URL for a query parameter like ?scrollTo=12 or ?scrollTo=12, 14
      if (scrollParam) {
        const ids = scrollParam.split(",");
        ids.forEach(id => {
        const row = document.getElementById(`appt-${id}`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
  }
  catch (err) {
    console.error("❌ Failed to load appointments:", err);
    document.getElementById('appointmentsBody').innerHTML = `
    <tr><td colspan="8" style="text-align:center; color: red; font-weight: bold;">
        ⚠️ Failed to connect to the server. Please try again later.
    </td></tr>
    `;
    }
}

// ─── Delete Appointments ─────────────────────────────────────────────────────────────────────
async function deleteAppointment(appointmentID){
  if(!currentUser || currentUser === null){
    alert("You must be logged in to delete an appointment.");
    return;
  }

  pendingDeleteID = appointmentID;// Store the ID to delete after confirmation
  document.getElementById('deleteModal').style.display = 'flex';
}

// ─── Edit Appointments ─────────────────────────────────────────────────────────────────────
function editAppointment(id) {
  //looks for the matching appointment from the appointments array using .find()
  const appt = appointments.find(a => a.appointmentID === id);

  //If no appointments is found, it alerts the user and exists the functions early
  if (!appt) {
    alert("Appointment not found.");
    return;
  }

  // Fill the form with appointment data
  document.getElementById('appointmentID').value = appt.appointmentID;
  document.getElementById('doctorName').value = appt.doctorName;
  document.getElementById('clinicName').value = appt.clinicName;
  document.getElementById('appointmentDate').value = appt.appointmentDate;
  document.getElementById('appointmentTime').value = appt.appointmentTime;
  document.getElementById('purpose').value = appt.purpose;
  document.getElementById('reminderDate').value = appt.reminderDate || "";

  // Switch UI to edit mode
  document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Edit Appointment';
  document.getElementById('editButtons').style.display = 'flex';
  document.getElementById('addButton').style.display = 'none';
  isEditing = true;//Store true to indicate we are in edit mode
}

// ─── Dislay a success popup/modal ─────────────────────────────────────────────────────────────────────
function showSuccessModal(message) {
  document.getElementById('successMessage').innerText = message;
  document.getElementById('successModal').style.display = 'flex';
}

// ─── Hides the success model that was previously shown using showSuccessModal() ─────────────────────────────
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────────────────────────
document.getElementById('confirmDeleteBtn').addEventListener('click', async function () {
  const appointmentID = pendingDeleteID;
  document.getElementById('deleteModal').style.display = 'none';

  try{
    const response = await fetch(`http://localhost:3000/appointments/${appointmentID}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await response.json();

    if(response.ok){
      showSuccessModal("Your record has been deleted successfully!");
      loadAppointments();// Refresh the list
      updateReminderBanner(); // Refresh reminders if needed
    }
    else {
      alert("❌ Error: " + result.error);
    }

  }
  catch(err){
    console.error("❌ Failed to delete appointment:", err);
    alert("❌ Failed to connect to the server.");
  }

  pendingDeleteID = null; // Clear the pending ID or Reset it
});

// ─── Cancel Delete ─────────────────────────────────────────────────────────────────────
document.getElementById('cancelDeleteBtn').addEventListener('click', function () {
  document.getElementById('deleteModal').style.display = 'none';
  pendingDeleteID = null;// Clear the pending ID or Reset it
})

// ─── Search for Appointments ─────────────────────────────────────────────
async function searchAppointments() {
  const keyword = document.getElementById("searchKeyword").value.trim();
  const date = document.getElementById("filterByDate").value;

  const queryParams = new URLSearchParams(); // create a query string object
  if (keyword) queryParams.append("searchTerm", keyword); 
  if (date) queryParams.append("appointmentDate", date);
  //adds keyword and date to the query string only if they exist

  try {
    const response = await fetch(`${apiBaseUrl}/appointments/search?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || result.message || "❌ Error searching appointments.");
      return;
    }

    // Handle case: No matching results
    const data = Array.isArray(result) ? result : result.data || [];
    if (data.length === 0) {
      document.getElementById("appointmentsBody").innerHTML = `
        <tr><td colspan="7" style="text-align:center; color: #999;">No matching appointments found.</td></tr>`;
      return;
    }

    appointments = data;//updates the appointments array with the results
    renderTable();

  } catch (err) {
    console.error("❌ Failed to search appointments:", err);
    alert("❌ Failed to connect to the server.");
  }
}

// ─── The box where there are two options: edit and delete will pop up here ─────────────────────────────────────────────
document.addEventListener("click", function (e) {
  //Get elements with class dropdown-menu
  const allMenus = document.querySelectorAll(".dropdown-menu");

  // If user clicks on ⋮ icon
  if (e.target.classList.contains("dropdown-trigger")) {
    const menu = e.target.nextElementSibling;

    //hides all other dropdown menus except the one being triggered
    //prevents multiple menus from being open at once
    allMenus.forEach(m => {
      if (m !== menu) m.style.display = "none";
    });
    
    //Toggles the clicked menu: if it's already open, close it. If it's closed, open it.
    menu.style.display = menu.style.display === "block" ? "none" : "block";
    e.stopPropagation(); // prevent from bubbling to document
  } 

  else {
    allMenus.forEach(m => m.style.display = "none"); 
  }
});

// ─── Runs immediately when the HTML page is fully loaded ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
  //Get the current user
  currentUser = await getToken(token);
  console.log("Current User:", currentUser);//Debugging
  //Setupt the search button
  document.querySelector(".search-filter button").addEventListener("click", function (e) {
    e.preventDefault();
    searchAppointments();
  });

  //Load and display all appointments
  loadAppointments();

  //Cancel edit button
  //When the cancel btn is clicked while editing,
  document.getElementById('cancelEditButton').addEventListener('click', function () {
    document.getElementById('appointment-form').reset();//Clear form fields
    resetFormMode();//Switch back to "Add New Appointment" mode
  });

  //Reminder Banner Alert
  try {
    if (!currentUser) {
      console.warn("Token invalid or expired.");
      return;
    }
    const response = await fetch(`${apiBaseUrl}/appointments/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.warn("Failed to fetch appointments:", response.status);
      return;
    }

    //Filter only reminders for today
    const appointments = await response.json();
    const today = new Date().toISOString().split("T")[0]; // format: YYYY-MM-DD

    // Filter appointments for today's reminders by comparing reminderDate
    const todaysReminders = appointments.filter(appt => {
      if (!appt.reminderDate) return false;
      const formatted = new Date(appt.reminderDate).toISOString().split("T")[0];
      return formatted === today;
    });

    //Show banner if any reminders match
    if (todaysReminders.length > 0) {
      showReminderAlert(todaysReminders);
    }
    
  } catch (err) {
    console.error("❌ Reminder alert error:", err);
  }
});

// ─── Dismissed (hides and removes) the reminder banner ─────────────────────────────────────────────
function dismissReminderBanner() {
  const banner = document.getElementById("reminderBanner"); //finds the reminder banner element using its ID
  if (banner) {
    banner.classList.remove("active"); // Slide out

    // Remove the element after animation finishes
    setTimeout(() => {
      banner.remove();
      document.body.style.paddingTop = "0";
    }, 500); // match transition duration
  }
}

// ─── Show the reminde alert banner ─────────────────────────────────────────────
function showReminderAlert(reminders) {
  const alertDiv = document.createElement("div");
  alertDiv.id = "reminderBanner";

  //Group appointment IDs by formatted appointmentDate
  const grouped = {};
  for (let appt of reminders) {
    const dateStr = new Date(appt.appointmentDate).toLocaleDateString('en-GB');
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(appt.appointmentID);
  }

  // Create pluralization based on number of reminders
  const plural = reminders.length === 1 ? "appointment" : "appointments";

  const links = Object.entries(grouped).map(([date, ids]) => {
    return `<span class="appt-link" data-ids="${ids.join(',')}">${date}</span>`;
  }).join(", ");

  alertDiv.innerHTML = `
    <span class="close-banner" onclick="dismissReminderBanner()">✖</span>
    🔔 <strong>Reminder:</strong> You have ${reminders.length} ${plural} for ${links}.
  `;

  document.body.prepend(alertDiv);
  document.body.style.paddingTop = "60px";

  // Slide in animation
  setTimeout(() => alertDiv.classList.add("active"), 50);

  //Add click handlers to each .appt-link
  document.querySelectorAll(".appt-link").forEach(el => {
    el.style.cursor = "pointer";
    el.addEventListener("click", function () {
      const ids = this.dataset.ids.split(",");
      ids.forEach(id => {
        const row = document.getElementById(`appt-${id}`);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });
  });
}

// ─── Update Reminder Banner ─────────────────────────────────────────────
async function updateReminderBanner() {
  try {
    if (!token) return;

    const response = await fetch(`${apiBaseUrl}/appointments/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) return;

    const appointments = await response.json();
    const today = new Date().toISOString().split("T")[0];

    //Filter out any appointment that has no reminder date or a reminder date that isn't today
    const todaysReminders = appointments.filter(appt => {
      if (!appt.reminderDate) return false;
      const formatted = new Date(appt.reminderDate).toISOString().split("T")[0];
      return formatted === today;
    });

    // Remove any existing banner first
    dismissReminderBanner();

    if (todaysReminders.length > 0) {
      showReminderAlert(todaysReminders);
    }

  } catch (err) {
    console.error("⚠️ Failed to update reminder banner:", err);
  }
}





