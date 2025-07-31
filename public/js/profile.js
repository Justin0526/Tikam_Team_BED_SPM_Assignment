let currentUser = null;
const apiBaseURl = "http://localhost:3000/api";

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
      document.getElementById("fullname").value = data.fullName || "";
      document.getElementById("dob").value = data.dob ? data.dob.split('T')[0] : "";
      document.getElementById("gender").value = data.gender || "";
      document.getElementById("emergencyName").value = data.emergencyName || "";
      document.getElementById("emergencyNumber").value = data.emergencyNumber || "";
      document.getElementById("address").value = data.address || "";
      document.getElementById("bio").value = data.bio || "";

      populateCheckboxes(data.allergies, "allergy-options", "other-allergy", "allergy-other-check");
      populateCheckboxes(data.chronicConditions, "condition-options", "other-conditions", "condition-other-check");

      // ✅ Load profile picture
      const profilePic = data.profilePicture || "../images/default-avatar.png";
      document.getElementById("avatarPic").src = profilePic;
      document.getElementById("profilePicture").value = data.profilePicture || "";
      const headerImg = document.getElementById("headerProfilePic");
      if (headerImg) headerImg.src = profilePic;
    })
    .catch(err => {
      console.error("❌ Failed to load profile:", err);
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
  // ✅ Toggle "Others"
  document.getElementById("allergy-other-check").addEventListener("change", e => {
    document.getElementById("other-allergy").style.display = e.target.checked ? "block" : "none";
  });
  document.getElementById("condition-other-check").addEventListener("change", e => {
    document.getElementById("other-conditions").style.display = e.target.checked ? "block" : "none";
  });

  const uploadBtn = document.getElementById("uploadBtn");
  const avatarPic = document.getElementById("avatarPic");

  // ✅ Cloudinary Upload
  uploadBtn.addEventListener("click", function () {
    cloudinary.openUploadWidget({
      cloudName: 'dvgx5dw12',
      uploadPreset: 'healthyLah_unsigned',
      sources: ['local', 'url', 'camera'],
      multiple: false,
      cropping: true,
      folder: 'HealthyLah_ProfilePics',
      maxFileSize: 1000000
    }, function (error, result) {
      if (error) {
        console.error("❌ Cloudinary error:", error);
        return;
      }
      if (result?.event === "success") {
        const imageUrl = result.info.secure_url;
        avatarPic.src = imageUrl;
        document.getElementById("profilePicture").value = imageUrl;
      }
    });
  });

  // ✅ Remove Profile Picture
  const removeBtn = document.getElementById("removeProfilePic");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      avatarPic.src = "../images/default-avatar.png";
      document.getElementById("profilePicture").value = "";
    });
  }

  // ✅ Form Submit
  document.querySelector('.profile-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const dobInput = document.getElementById("dob").value;
    if (dobInput) {
      const enteredDate = new Date(dobInput);
      const today = new Date();
      if (enteredDate > today) {
        alert("❌ Date of birth cannot be in the future.");
        return;
      }
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
      profilePicture: document.getElementById("profilePicture").value || null
    };

    try {
      const res = await fetch(`${apiBaseURl}/profile/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`❌ Failed to update profile: ${data.error}`);
        return;
      }

      alert('✅ Profile updated successfully!');
      const headerImg = document.getElementById("headerProfilePic");
      headerImg.src = formData.profilePicture ? formData.profilePicture : "../images/default-avatar.png";

    } catch (err) {
      console.error('❌ Fetch error:', err);
      alert('❌ Failed to update profile.');
    }
  });
});
