// Wait for the DOM content to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", async () => {
  // Retrieve the stored JWT token from localStorage
  const rawToken = localStorage.getItem("authToken");

  // Decode and verify the token to get user information (helper function assumed to exist globally)
  const tokenData = await getToken(rawToken);

  // If no token or userID is found, show a message asking the user to log in
  if (!tokenData || !tokenData.userID) {
    document.querySelector(".profile-section").innerHTML = "<p>Please log in to view your health profile.</p>";
    return;
  }

  try {
    // Send a GET request to the backend to retrieve the health profile for the authenticated user
    const res = await fetch("http://localhost:3000/api/health-profile", {
      headers: {
        // Include the token in the request header for authentication
        "Authorization": `Bearer ${rawToken}`
      }
    });

    // If the request failed, throw an error to be caught later
    if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);

    // Parse the JSON response to get profile data
    const profile = await res.json();

    // Calculate age based on date of birth
    const dob = new Date(profile.dob);
    const age = new Date().getFullYear() - dob.getFullYear();

    // Dynamically inject the health profile HTML into the page
    document.querySelector(".profile-section").innerHTML = `
      <h2>My Health Profile</h2>
      <div class="profile-name">${profile.fullName}</div>
      <div class="profile-details">
        <div class="detail-item"><strong>Age:</strong> <span>${age} years</span></div>
        <div class="detail-item"><strong>Gender:</strong> <span>${profile.gender}</span></div>
        <div class="detail-item"><strong>Allergies:</strong> <span>${profile.allergies}</span></div>
        <div class="detail-item"><strong>Chronic Conditions:</strong> <span>${profile.chronicConditions}</span></div>
        <div class="detail-item"><strong>Emergency Contact:</strong> <span>${profile.emergencyName} - ${profile.emergencyNumber}</span></div>
      </div>
    `;
  } catch (err) {
    // Handle and log any errors encountered during the fetch operation
    console.error("Error loading health profile:", err);
    document.querySelector(".profile-section").innerHTML = `<p>⚠ Failed to load profile</p>`;
  }
});