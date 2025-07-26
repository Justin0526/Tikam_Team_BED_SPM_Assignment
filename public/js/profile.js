let currentUser = null;
const apiBaseURl = "http://localhost:3000/api";

// Load user data when page loads
window.addEventListener('load', async () => {
  currentUser = await getToken(token);
  getUserProfile(currentUser);
});

async function getUserProfile(currentUser) {
  if (!currentUser) return;
  const userID = currentUser.userID;

  fetch(`${apiBaseURl}/profile/${userID}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      console.log("✅ Loaded profile:", data);
      document.getElementById("fullname").value = data.fullName || "";
      document.getElementById("dob").value = data.dob ? data.dob.split('T')[0] : "";
      document.getElementById("gender").value = data.gender || "";
      document.getElementById("emergencyName").value = data.emergencyName || "";
      document.getElementById("emergencyNumber").value = data.emergencyNumber || "";
      document.getElementById("address").value = data.address || "";
      document.getElementById("bio").value = data.bio || "";

      populateCheckboxes(data.allergies, "allergy-options", "other-allergy", "allergy-other-check");
      populateCheckboxes(data.chronicConditions, "condition-options", "other-conditions", "condition-other-check");

      // Load profile picture if available
      if (data.profilePicture) {
        console.log("✅ Existing profile picture:", data.profilePicture);
        document.getElementById("avatarPic").src = data.profilePicture;
        document.getElementById("headerProfilePic").src = data.profilePicture;
        document.getElementById("profilePicture").value = data.profilePicture; // ✅ Preload
      }
    })
    .catch(err => {
      console.error("❌ Failed to load profile:", err);
      alert("❌ Failed to load profile data.");
    });
}

function populateCheckboxes(dataString, containerId, otherInputId, otherCheckId) {
  const items = dataString?.split(',').map(i => i.trim()) || [];
  const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]`);
  const otherInput = document.getElementById(otherInputId);
  const otherCheck = document.getElementById(otherCheckId);

  let otherValues = [];
  items.forEach(item => {
    let found = false;
    checkboxes.forEach(cb => {
      if (cb.value === item) {
        cb.checked = true;
        found = true;
      }
    });
    if (!found && item) otherValues.push(item);
  });

  if (otherValues.length > 0) {
    otherCheck.checked = true;
    otherInput.style.display = 'block';
    otherInput.value = otherValues.join(', ');
  }
}

function getCombinedCheckboxes(containerId, otherInputId) {
  const checked = [...document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)]
                  .map(cb => cb.value).filter(val => val !== "Others");
  const other = document.getElementById(otherInputId).value.trim();
  if (other) checked.push(...other.split(',').map(s => s.trim()));
  return checked.join(', ');
}

document.addEventListener('DOMContentLoaded', () => {
  // Toggle "Others" input for allergies and conditions
  document.getElementById("allergy-other-check").addEventListener("change", e => {
    document.getElementById("other-allergy").style.display = e.target.checked ? "block" : "none";
  });
  document.getElementById("condition-other-check").addEventListener("change", e => {
    document.getElementById("other-conditions").style.display = e.target.checked ? "block" : "none";
  });

  const uploadBtn = document.getElementById("uploadBtn");
  const avatarPic = document.getElementById("avatarPic");
  const headerProfilePic = document.getElementById("headerProfilePic");

  // ✅ Cloudinary Upload Widget
  uploadBtn.addEventListener("click", function () {
    console.log("📤 Opening Cloudinary Widget...");
    cloudinary.openUploadWidget({
      cloudName: 'dvgx5dw12', // ✅ Replace with your Cloudinary cloud name
      uploadPreset: 'healthyLah_unsigned', // ✅ Replace with your unsigned preset
      sources: ['local', 'url', 'camera'],
      multiple: false,
      cropping: true,
      folder: 'HealthyLah_ProfilePics',
      maxFileSize: 1000000
    }, function (error, result) {
      console.log("📥 Cloudinary Callback Fired");
      if (error) {
        console.error("❌ Cloudinary upload error:", error);
        return;
      }
      console.log("Cloudinary Result:", result);
      if (result?.event === "success") {
        const imageUrl = result.info.secure_url;
        console.log("✅ Image uploaded:", imageUrl);
        document.getElementById("avatarPic").src = imageUrl;
        document.getElementById("profilePicture").value = imageUrl; // ✅ Save new URL
      }
    });
  });

  // Handle profile form submission
  document.querySelector('.profile-form').addEventListener('submit', function (e) {
    e.preventDefault();

    let currentProfilePicture = document.getElementById("profilePicture").value;
    if (!currentProfilePicture) {
      console.warn("⚠️ No image uploaded and no existing image, sending null");
    }

    const formData = {
      userID: currentUser.userID,
      fullName: document.getElementById("fullname").value,
      dob: document.getElementById("dob").value,
      gender: document.getElementById("gender").value,
      allergies: getCombinedCheckboxes("allergy-options", "other-allergy"),
      conditions: getCombinedCheckboxes("condition-options", "other-conditions"),
      emergencyName: document.getElementById("emergencyName").value,
      emergencyNumber: document.getElementById("emergencyNumber").value,
      address: document.getElementById("address").value,
      bio: document.getElementById("bio").value,
      profilePicture: currentProfilePicture || null
    };

    console.log("📦 Sending data:", formData);

    fetch(`${apiBaseURl}/profile/update`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        console.error("❌ API Error:", data);
        alert(`❌ Failed to update profile: ${data.errors ? data.errors.join(", ") : data.error}`);
        return;
      }
      console.log("✅ Update Success:", data);
      alert('✅ Profile updated successfully!');
    })
    .catch(err => {
      console.error('❌ Fetch error:', err);
      alert('❌ Failed to update profile.');
    });
  });
});
