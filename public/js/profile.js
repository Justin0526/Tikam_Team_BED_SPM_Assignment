let currentUser = null;
const apiBaseURl = "http://localhost:3000/api";

window.addEventListener('load', async () => {
  currentUser = await getToken(token);
  getUserProfile(currentUser);
});

async function getUserProfile(currentUser) {
  if (!currentUser) return;

  const userID = currentUser.userID;
  fetch(`${apiBaseURl}/profile/${userID}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("fullname").value = data.fullName || "";
      document.getElementById("dob").value = data.dob ? data.dob.split('T')[0] : "";
      document.getElementById("gender").value = data.gender || "";
      document.getElementById("emergencyName").value = data.emergencyName || "";
      document.getElementById("emergencyNumber").value = data.emergencyNumber || "";
      document.getElementById("address").value = data.address || "";
      document.getElementById("bio").value = data.bio || "";

      populateCheckboxes(data.allergies, "allergy-options", "other-allergy");
      populateCheckboxes(data.chronicConditions, "condition-options", "other-conditions");

      const savedImage = localStorage.getItem('profileImage');
      if (savedImage) {
        document.getElementById("avatarPic").src = savedImage;
        document.getElementById("headerProfilePic").src = savedImage;
      }
    })
    .catch(err => {
      console.error("Failed to load profile:", err);
      alert("❌ Failed to load profile data.");
    });
}

function populateCheckboxes(dataString, containerId, otherInputId) {
  const items = dataString?.split(',').map(i => i.trim()) || [];
  const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]`);
  const otherInput = document.getElementById(otherInputId);

  items.forEach(item => {
    let found = false;
    checkboxes.forEach(cb => {
      if (cb.value === item) {
        cb.checked = true;
        found = true;
      }
    });
    if (!found) {
      document.getElementById(`${cbGroupName}-other-check`).checked = true;
      otherInput.style.display = 'block';
      otherInput.value = item;
    }
  });
}

function getCombinedCheckboxes(containerId, otherInputId) {
  const checked = [...document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)]
                  .map(cb => cb.value).filter(val => val !== "Others");
  const other = document.getElementById(otherInputId).value.trim();
  if (other) checked.push(...other.split(',').map(s => s.trim()));
  return checked.join(', ');
}

document.addEventListener('DOMContentLoaded', () => {
  const allergyOtherCheck = document.getElementById("allergy-other-check");
  const conditionOtherCheck = document.getElementById("condition-other-check");

  allergyOtherCheck.addEventListener("change", () => {
    document.getElementById("other-allergy").style.display = allergyOtherCheck.checked ? "block" : "none";
  });

  conditionOtherCheck.addEventListener("change", () => {
    document.getElementById("other-conditions").style.display = conditionOtherCheck.checked ? "block" : "none";
  });

  const uploadBtn = document.getElementById("uploadBtn");
  const avatarPic = document.getElementById("avatarPic");
  const headerProfilePic = document.getElementById("headerProfilePic");

  const savedImage = localStorage.getItem('profileImage');
  if (savedImage) {
    avatarPic.src = savedImage;
    headerProfilePic.src = savedImage;
  }

  uploadBtn.addEventListener("click", function () {
    cloudinary.openUploadWidget({
      cloudName: 'dvgx5dw12',
      uploadPreset: 'hp9lpsha',
      sources: ['local', 'url', 'camera'],
      multiple: false,
      cropping: true,
      folder: 'profile_pictures',
      maxFileSize: 1000000
    }, function (error, result) {
      if (error) return console.error("Cloudinary upload error:", error);
      if (result?.event === "success") {
        const imageUrl = result.info.secure_url;
        avatarPic.src = imageUrl;
        headerProfilePic.src = imageUrl;
        localStorage.setItem('profileImage', imageUrl);
      }
    });
  });

  document.querySelector(".remove-btn").addEventListener("click", () => {
    const defaultImg = "../images/default_avatar.png";
    avatarPic.src = defaultImg;
    headerProfilePic.src = defaultImg;
    localStorage.removeItem('profileImage');
  });

  document.querySelector('.profile-form').addEventListener('submit', function (e) {
    e.preventDefault();

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
      bio: document.getElementById("bio").value
    };

    fetch(`${apiBaseURl}/profile/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        alert('✅ Profile updated successfully!');
      })
      .catch(err => {
        console.error('Profile update failed:', err);
        alert('❌ Failed to update profile. Please try again later.');
      });
  });
});
