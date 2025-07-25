let currentUser = null;
let meals = [];
let isEditing = false;
let pendingDeleteID = null;

// ─── Reset Form Mode ─────────────────────────────────────────────────────────────────────
function resetFormMode() {
  isEditing = false; //tells the rest of the app that it is not in edit mode in default
  document.getElementById('mealID').value = '';
  document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Add Meal Log';
  document.getElementById('editButtons').style.display = 'none';
  document.getElementById('addButton').style.display = 'block';

  document.getElementById("manualCaloriesLabel").style.display = "none";
  document.getElementById("manualCalories").style.display = "none";
}

// ─── Show Manual Calorie Input ─────────────────────────────────────────────────────────────────────
function showManualCalorieInput() {
  document.getElementById("manualCaloriesLabel").style.display = "block";
  document.getElementById("manualCalories").style.display = "block";
  document.getElementById("manualCalories").value = ''; // optional: clear field
}

// ─── Handles the submission of your meal log form  (adding and editing )─────────────────────────────────────────────────────────────────────
document.getElementById('meal-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!currentUser) {
    alert("You must be logged in to log meals.");
    return;
  }

  const mealID = document.getElementById('mealID').value;

  //Builds a meal object from the form input fields
  const meal = {
    timeFrame: document.getElementById('timeFrame').value,
    foodItem: document.getElementById('foodItem').value,
    mealDate: document.getElementById('mealDate').value
  };

  //If the user typed in calories manually, include it in the object
  //If the field is empty and set it to null
  const manualInput = document.getElementById('manualCalories').value.trim();
  meal.manualCalories = manualInput !== "" ? manualInput : null;

  try {
    let response;
    //If editing existing meal
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
    }
    //If adding new meal 
    else {
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

// ─── Render Meals Table ─────────────────────────────────────────────────────────────────────
function renderMealsTable() {
  const body = document.getElementById("mealsBody");
  const summary = document.getElementById("totalCalories");
  body.innerHTML = '';
  let total = 0;

  //If there are no meals
  if (meals.length === 0) {
    body.innerHTML = `<tr id="emptyState">
        <td colspan="5" style="text-align:center; padding: 20px; color: #888; font-style: italic;">No meals logged yet. Add one above to get started.</td>
      </tr>`;
    summary.innerText = "0";
    return;
  }

  //Loop through each meal
  meals.forEach(meal => {
    const row = document.createElement('tr');

    //Fill the row with meal data
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
    
    //Append row and update total
    body.appendChild(row);
    total += Number(meal.calories || 0);
  });

  //Update total calories display
  summary.innerText = total.toString();
}

// ─── Load Meals ─────────────────────────────────────────────────────────────────────
async function loadMeals() {
  try {
    const date = document.getElementById("filterByDate").value;
    const query = date ? `?mealDate=${date}` : ''; // If a date is provided, builds a query string like ?mealDate=2025-07-26
    
    //Fetch meals from backend
    const response = await fetch(`http://localhost:3000/meals/me${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    //Check for session expiration
    if (response.status === 401) {
      document.getElementById("mealsBody").innerHTML = `
        <tr><td colspan="5" style="text-align:center; color: red;">
        Session expired. Please <a href="login.html">log in again</a>.</td></tr>`;
      return;
    }

    //Handle successful response
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to load meals");

    //Update UI
    meals = data;
    renderMealsTable();
  } catch (err) {
    console.error("❌ Failed to load meals:", err);
    document.getElementById("mealsBody").innerHTML = `
      <tr><td colspan="5" style="text-align:center; color: red;">
      ⚠️ Failed to connect to the server.</td></tr>`;
  }
}

// ─── Edit Meals ─────────────────────────────────────────────────────────────────────
function editMeal(mealID) {
  //Search the global meals array for a meal that matches the given mealID
  //Uses .find() to return the full meal object
  const meal = meals.find(m => m.mealID === mealID);
  if (!meal) return alert("Meal not found."); // If the meal isn't found, it alerts the user

  //Pre-fill the form with the meal's data
  document.getElementById("mealID").value = meal.mealID;
  document.getElementById("timeFrame").value = meal.timeFrame;
  document.getElementById("foodItem").value = meal.foodItem;
  document.getElementById("mealDate").value = meal.mealDate;

  // Always show and pre-fill manualCalories field
  document.getElementById("manualCaloriesLabel").style.display = "block";
  document.getElementById("manualCalories").style.display = "block";
  document.getElementById("manualCalories").value = (meal.calories !== null) ? meal.calories : '';
  
  document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Edit Meal Log';
  document.getElementById('editButtons').style.display = 'flex';
  document.getElementById('addButton').style.display = 'none';
  isEditing = true;
}

// ─── Delete Meals ─────────────────────────────────────────────────────────────────────
function deleteMeal(mealID) {
  if (!currentUser) {
    alert("You must be logged in to delete a meal log.");
    return;
  }
  pendingDeleteID = mealID; // Temporarily stores the mealID in a global variable
  document.getElementById("deleteModal").style.display = "flex";
}

// ─── Confirm Delete ─────────────────────────────────────────────────────────────────────
document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
  const mealID = pendingDeleteID;
  document.getElementById("deleteModal").style.display = "none";

  //Send DELETE request to backend
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

// ─── Cancel Delete  ─────────────────────────────────────────────────────────────────────
document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
  document.getElementById("deleteModal").style.display = "none";
  pendingDeleteID = null;
});

// ─── Show Success Message  ─────────────────────────────────────────────────────────────────────
function showSuccessModal(message) {
  document.getElementById("successMessage").innerText = message;
  document.getElementById("successModal").style.display = "flex";
}

// ─── Close Success Message ─────────────────────────────────────────────────────────────────────
function closeSuccessModal() {
  document.getElementById("successModal").style.display = "none";
}

// ─── Cancel Edit Button ─────────────────────────────────────────────────────────────────────
document.getElementById("cancelEditButton").addEventListener("click", function () {
  document.getElementById("meal-form").reset();
  resetFormMode();
});

// ─── Filter by Date  ─────────────────────────────────────────────────────────────────────
document.getElementById("filterByDate").addEventListener("change", () => {
  loadMeals(); //to refresh meals table again if filter by date is clicked
});

// ─── Toggles the visibility of the dropdown menu  ─────────────────────────────────────────────────────────────────────
document.addEventListener("click", function (e) {
  //Adds a global click listener to the entire page.
  //Every time the user clicks anywhere, this function runs.
  const allMenus = document.querySelectorAll(".dropdown-menu");
  //Selects all dropdown menus (the small boxes that contain "Edit" and "Delete").

  //If user clicks the ":" icon
  if (e.target.classList.contains("dropdown-trigger")) {
    const menu = e.target.nextElementSibling;
    allMenus.forEach(m => (m !== menu ? (m.style.display = "none") : null));
    menu.style.display = menu.style.display === "block" ? "none" : "block";
    e.stopPropagation(); //Prevents the click from bubbling up and triggering the else block below
  } 
  else {
    allMenus.forEach(m => (m.style.display = "none"));
    //If the click was not on a dropdown-trigger, then close all menus
  }
});

// ─── Set up my app's initial state  ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
  currentUser = await getToken(token);
  console.log("Current user:", currentUser);
  loadMeals();
});

