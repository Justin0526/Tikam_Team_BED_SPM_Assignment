let currentUser = null;
let meals = [];
let isEditing = false;
let pendingDeleteID = null;

function resetFormMode() {
  isEditing = false;
  document.getElementById('mealID').value = '';
  document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Add Meal Log';
  document.getElementById('editButtons').style.display = 'none';
  document.getElementById('addButton').style.display = 'block';

  document.getElementById("manualCaloriesLabel").style.display = "none";
  document.getElementById("manualCalories").style.display = "none";
  // document.getElementById("manualCaloriesNote").style.display = "none";

}

function showManualCalorieInput() {
  document.getElementById("manualCaloriesLabel").style.display = "block";
  document.getElementById("manualCalories").style.display = "block";
  // document.getElementById("manualCaloriesNote").style.display = "block";
  document.getElementById("manualCalories").value = ''; // optional: clear field
}

// // Handle form submit (Create or Update)
// document.getElementById('meal-form').addEventListener('submit', async function (e) {
//   e.preventDefault();

//   //test
//   if (!currentUser) {
//     alert("You must be logged in to log meals.");
//     return;
//   }

//   const mealID = document.getElementById('mealID').value;
//   const meal = {
//     timeFrame: document.getElementById('timeFrame').value,
//     foodItem: document.getElementById('foodItem').value,
//     mealDate: document.getElementById('mealDate').value
//   };

//   // Include manualCalories only if it's visible
//   const manualFieldVisible = document.getElementById("manualCalories").style.display === "block";
//   if (manualFieldVisible) {
//     const manualInput = document.getElementById('manualCalories').value.trim();
//     meal.manualCalories = manualInput; // Could be empty or "unknown"
//   }

//   try {
//     let response;
//     if (isEditing) {
//       response = await fetch(`http://localhost:3000/meals/${mealID}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify(meal)
//       });
//     } else {
//       response = await fetch('http://localhost:3000/meals', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify(meal)
//       });
//     }

//     const result = await response.json();
//     if(result.requiresManual){
//       showManualCalorieInput();// display input
//       alert("⚠️ Calorie data not found. Please enter it manually and submit again.");
//       return; // stop here, wait for second submit
//     }
//     if (response.ok) {
//       showSuccessModal("Meal log saved successfully!");
//       this.reset();
//       resetFormMode();
//       loadMeals();
//     } else {
//       alert("❌ Error: " + result.error);
//     }

//   } catch (err) {
//     console.error("❌ Network error:", err);
//     alert("❌ Failed to connect to the server.");
//   }
// });

document.getElementById('meal-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!currentUser) {
    alert("You must be logged in to log meals.");
    return;
  }

  const mealID = document.getElementById('mealID').value;

  const meal = {
    timeFrame: document.getElementById('timeFrame').value,
    foodItem: document.getElementById('foodItem').value,
    mealDate: document.getElementById('mealDate').value
  };

  // Include manualCalories if it's visible
  // const manualFieldVisible = document.getElementById("manualCalories").style.display === "block";
  // if (manualFieldVisible) {
  //   const manualInput = document.getElementById('manualCalories').value.trim();
  //   meal.manualCalories = manualInput !== "" ? manualInput : null; // Could be empty or "unknown"
  // }
  
  const manualInput = document.getElementById('manualCalories').value.trim();
  meal.manualCalories = manualInput !== "" ? manualInput : null;

  try {
    let response;
    if (isEditing) {
      console.log("Submitting meal:", meal);
      response = await fetch(`http://localhost:3000/meals/${mealID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(meal)
      });
    } else {
      response = await fetch('http://localhost:3000/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(meal)
      });
    }

    const result = await response.json();

    // If backend says manual entry is needed
    if (result.requiresManual) {
      showManualCalorieInput();
      // alert("⚠️ Sorry, Calorie data not found. Please enter it manually and submit again.");
      showSuccessModal("😔 Sorry! We couldn't find the calorie information for this food. Please enter it manually and click 'Add Meal' again");
      return; // wait for second submit
    }

    if (response.ok) {
      showSuccessModal("Meal log saved successfully!");
      this.reset();
      resetFormMode();
      loadMeals();
    } else {
      alert("❌ Error: " + result.error);
    }

  } catch (err) {
    console.error("❌ Network error:", err);
    alert("❌ Failed to connect to the server.");
  }
});

function renderMealsTable() {
  const body = document.getElementById("mealsBody");
  const summary = document.getElementById("totalCalories");
  body.innerHTML = '';
  let total = 0;

  if (meals.length === 0) {
    body.innerHTML = `<tr id="emptyState">
        <td colspan="5" style="text-align:center; padding: 20px; color: #888; font-style: italic;">No meals logged yet. Add one above to get started.</td>
      </tr>`;
    summary.innerText = "0";
    return;
  }

  meals.forEach(meal => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${meal.timeFrame}</td>
      <td>${meal.foodItem}</td>
      <td>${meal.calories === null ? '<span style="color: #888; font-style: italic;">Unknown</span>' : meal.calories}</td>
      <td>${meal.mealDate.split('-').reverse().join(' - ')}</td>
      <td class="actions">
        <div class="dropdown-container">
          <span class="dropdown-trigger">⋮</span>
          <div class="dropdown-menu" style="display: none;">
            <div class="dropdown-item" onclick="editMeal(${meal.mealID})">Edit</div>
            <div class="dropdown-item" onclick="deleteMeal(${meal.mealID})">Delete</div>
          </div>
        </div>
      </td>`;
    body.appendChild(row);
    total += Number(meal.calories || 0);
  });

  summary.innerText = total.toString();
}

async function loadMeals() {
  try {
    const date = document.getElementById("filterByDate").value;
    const query = date ? `?mealDate=${date}` : '';
    const response = await fetch(`http://localhost:3000/meals/me${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 401) {
      document.getElementById("mealsBody").innerHTML = `
        <tr><td colspan="5" style="text-align:center; color: red;">
        Session expired. Please <a href="login.html">log in again</a>.</td></tr>`;
      return;
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to load meals");

    meals = data;
    renderMealsTable();
  } catch (err) {
    console.error("❌ Failed to load meals:", err);
    document.getElementById("mealsBody").innerHTML = `
      <tr><td colspan="5" style="text-align:center; color: red;">
      ⚠️ Failed to connect to the server.</td></tr>`;
  }
}

function editMeal(mealID) {
  const meal = meals.find(m => m.mealID === mealID);
  if (!meal) return alert("Meal not found.");

  document.getElementById("mealID").value = meal.mealID;
  document.getElementById("timeFrame").value = meal.timeFrame;
  document.getElementById("foodItem").value = meal.foodItem;
  document.getElementById("mealDate").value = meal.mealDate;
  document.getElementById("manualCalories").value = meal.manualCalories;

  // ✅ Always show and pre-fill manualCalories field
  document.getElementById("manualCaloriesLabel").style.display = "block";
  document.getElementById("manualCalories").style.display = "block";
  // document.getElementById("manualCaloriesNote").style.display = "block";
  document.getElementById("manualCalories").value = (meal.calories !== null) ? meal.calories : '';
  
  document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Edit Meal Log';
  document.getElementById('editButtons').style.display = 'flex';
  document.getElementById('addButton').style.display = 'none';
  isEditing = true;
}

function deleteMeal(mealID) {
  if (!currentUser) {
    alert("You must be logged in to delete a meal log.");
    return;
  }
  pendingDeleteID = mealID;
  document.getElementById("deleteModal").style.display = "flex";
}

document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
  const mealID = pendingDeleteID;
  document.getElementById("deleteModal").style.display = "none";

  try {
    const response = await fetch(`http://localhost:3000/meals/${mealID}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const result = await response.json();

    if (response.ok) {
      showSuccessModal("Meal deleted successfully!");
      loadMeals();
    } else {
      alert("❌ Error: " + result.error);
    }
  } catch (err) {
    console.error("❌ Failed to delete:", err);
    alert("❌ Failed to connect to the server.");
  }
  pendingDeleteID = null;
});

document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
  document.getElementById("deleteModal").style.display = "none";
  pendingDeleteID = null;
});

function showSuccessModal(message) {
  document.getElementById("successMessage").innerText = message;
  document.getElementById("successModal").style.display = "flex";
}

function closeSuccessModal() {
  document.getElementById("successModal").style.display = "none";
}

document.getElementById("cancelEditButton").addEventListener("click", function () {
  document.getElementById("meal-form").reset();
  resetFormMode();
});

document.getElementById("filterByDate").addEventListener("change", () => {
  loadMeals();
});

// Dropdown menu toggle
document.addEventListener("click", function (e) {
  const allMenus = document.querySelectorAll(".dropdown-menu");
  if (e.target.classList.contains("dropdown-trigger")) {
    const menu = e.target.nextElementSibling;
    allMenus.forEach(m => (m !== menu ? (m.style.display = "none") : null));
    menu.style.display = menu.style.display === "block" ? "none" : "block";
    e.stopPropagation();
  } else {
    allMenus.forEach(m => (m.style.display = "none"));
  }
});

document.addEventListener("DOMContentLoaded", async function () {
  currentUser = await getToken(token);
  console.log("Current user:", currentUser);
  loadMeals();
});

// // ─── Reminder Alert Banner ─────────────────────────────────────────────────────────
// document.addEventListener("DOMContentLoaded", async function () {
//   currentUser = await getToken(token);
//   console.log("Current user:", currentUser);
//   loadMeals();

//   try {
//     if (!currentUser) return;

//     const response = await fetch("http://localhost:3000/appointments/me", {
//       headers: { Authorization: `Bearer ${token}` }
//     });

//     if (!response.ok) return;

//     const appointments = await response.json();
//     const today = new Date().toISOString().split("T")[0];

//     const todaysReminders = appointments.filter(appt => {
//       if (!appt.reminderDate) return false;
//       const formatted = new Date(appt.reminderDate).toISOString().split("T")[0];
//       return formatted === today;
//     });

//     if (todaysReminders.length > 0) {
//       showReminderAlert(todaysReminders);
//     }
//   } catch (err) {
//     console.error("Reminder error:", err);
//   }
// });

// // Function to dismiss the reminder banner
// function dismissReminderBanner() {
//   const banner = document.getElementById("reminderBanner");
//   if (banner) {
//     banner.classList.remove("active"); // Slide out
//     setTimeout(() => banner.remove(), 300); // Wait for animation to finish
//     document.body.style.paddingTop = "0";
//   }
// }

// //Function to show the reminder alert banner
// function showReminderAlert(reminders) {
//   const alertDiv = document.createElement("div");
//   alertDiv.id = "reminderBanner";

//   const grouped = {};
//   for (let appt of reminders) {
//     const formattedDate = new Date(appt.appointmentDate).toLocaleDateString('en-GB');
//     if (!grouped[formattedDate]) grouped[formattedDate] = [];
//     grouped[formattedDate].push(appt.appointmentID);
//   }

//   const links = Object.entries(grouped).map(([date, ids]) => {
//     return `<a href="appointment_management.html?scrollTo=${ids.join(',')}" class="appt-link">${date}</a>`;
//   }).join(", ");

//   const plural = reminders.length === 1 ? "appointment" : "appointments";

//   alertDiv.innerHTML = `
//     <span class="close-banner" onclick="dismissReminderBanner()">✖</span>
//     🔔 <strong>Reminder:</strong> You have ${reminders.length} ${plural} for ${links}.
//   `;

//   document.body.prepend(alertDiv);
//   document.body.style.paddingTop = "60px";

//   // 👉 Trigger the slide-in after rendering
//   setTimeout(() => alertDiv.classList.add("active"), 10);
// }
