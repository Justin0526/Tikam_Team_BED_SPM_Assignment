let currentUser = null;
const apiBaseURl = "http://localhost:3000/api";
window.addEventListener('load', async () => {
  let currentUser = await getToken(token);
  getUserProfile(currentUser);
});

async function getUserProfile(currentUser) {  
  if (!currentUser) {
    console.warn("No user is currently logged in.");
    return;
  }
  const userID = currentUser.userID;
  fetch(`${apiBaseURl}/profile/${userID}`)
    .then(res => res.json())
    .then(data => {
      if (data) {
        document.getElementById("fullname").value = data.fullName || "";
        document.getElementById("dob").value = data.dob ? data.dob.split('T')[0] : "";
        document.getElementById("gender").value = data.gender || "";
        document.getElementById("emergencyName").value = data.emergencyName || "";
        document.getElementById("emergencyNumber").value = data.emergencyNumber || "";
        document.getElementById("address").value = data.address || "";
        document.getElementById("bio").value = data.bio || "";

        // Handle allergies
        const allergiesSelect = document.getElementById("allergies");
        const otherAllergyInput = document.getElementById("other-allergy");

        if (["Peanuts", "Seafood", "Lactose"].includes(data.allergies)) {
          allergiesSelect.value = data.allergies;
          otherAllergyInput.style.display = "none";
        } else if (data.allergies) {
          allergiesSelect.value = "Others";
          otherAllergyInput.style.display = "block";
          otherAllergyInput.value = data.allergies;
        }

        // Handle chronic conditions
        const conditionsSelect = document.getElementById("conditions");
        const otherConditionInput = document.getElementById("other-conditions");

        if (["Diabetes", "Hypertension", "Asthma"].includes(data.chronicConditions)) {
          conditionsSelect.value = data.chronicConditions;
          otherConditionInput.style.display = "none";
        } else if (data.chronicConditions) {
          conditionsSelect.value = "Others";
          otherConditionInput.style.display = "block";
          otherConditionInput.value = data.chronicConditions;
        }

        // Load image if saved
        const savedImage = localStorage.getItem('profileImage');
        if (savedImage) {
          document.getElementById("avatarPic").src = savedImage;
          document.getElementById("headerProfilePic").src = savedImage;
        }
      }
    })
    .catch(err => {
      console.error("Failed to load profile:", err);
      alert("❌ Failed to load profile data.");
    });
}
  

  document.addEventListener('DOMContentLoaded', () => {
    const allergyDropdown = document.getElementById("allergies");
    const otherAllergyInput = document.getElementById("other-allergy");

    allergyDropdown.addEventListener("change", () => {
      otherAllergyInput.style.display = allergyDropdown.value === "Others" ? "block" : "none";
    });

    const conditionsDropdown = document.getElementById("conditions");
    const otherConditionsInput = document.getElementById("other-conditions");

    conditionsDropdown.addEventListener("change", () => {
      otherConditionsInput.style.display = conditionsDropdown.value === "Others" ? "block" : "none";
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
        if (error) {
          console.error("Cloudinary upload error:", error);
          return;
        }

        if (result && result.event === "success") {
          const imageUrl = result.info.secure_url;
          avatarPic.src = imageUrl;
          headerProfilePic.src = imageUrl;
          localStorage.setItem('profileImage', imageUrl);
        }
      });
    });
  });

  document.querySelector(".remove-btn").addEventListener("click", () => {
    const defaultImg = "../images/default_avatar.png";
    document.getElementById("avatarPic").src = defaultImg;
    document.getElementById("headerProfilePic").src = defaultImg;
    localStorage.removeItem('profileImage');
  });

  document.querySelector('.profile-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = {
      userID: 1, // Replace with actual ID later
      fullName: document.getElementById("fullname").value,
      dob: document.getElementById("dob").value,
      gender: document.getElementById("gender").value,
      allergies: document.getElementById("allergies").value === "Others" ? document.getElementById("other-allergy").value : document.getElementById("allergies").value,
      conditions: document.getElementById("conditions").value === "Others" ? document.getElementById("other-conditions").value : document.getElementById("conditions").value,
      emergencyName: document.getElementById("emergencyName").value,
      emergencyNumber: document.getElementById("emergencyNumber").value,
      address: document.getElementById("address").value,
      bio: document.getElementById("bio").value
    };

    fetch('http://localhost:3000/api/profile/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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

  