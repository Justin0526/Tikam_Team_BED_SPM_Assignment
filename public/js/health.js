document.addEventListener("DOMContentLoaded", async () => {
  const rawToken = localStorage.getItem("authToken");
  const tokenData = await getToken(rawToken); // use your global helper

  if (!tokenData || !tokenData.userID) {
    document.querySelector(".profile-section").innerHTML = "<p>Please log in to view your health profile.</p>";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/health-profile", {
      headers: {
        "Authorization": `Bearer ${rawToken}`
      }
    });

    if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);

    const profile = await res.json();
    const dob = new Date(profile.dob);
    const age = new Date().getFullYear() - dob.getFullYear();

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
    console.error("Error loading health profile:", err);
    document.querySelector(".profile-section").innerHTML = `<p>⚠ Failed to load profile</p>`;
  }
});