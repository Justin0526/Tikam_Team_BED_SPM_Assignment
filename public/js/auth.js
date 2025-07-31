const token = localStorage.getItem("authToken");
const userProfile = document.getElementById("user-profile");
const apiBaseURL = "http://localhost:3000/api";

async function getToken(token) {
    if (token) {
        try {
            const decoded = jwt_decode(token);
            const currentTime = Math.floor(Date.now() / 1000); // Get in seconds

            if (decoded.exp && decoded.exp < currentTime) {
                // Token has expired
                console.warn("Token expired");
                localStorage.removeItem("authToken");
                userProfile.innerHTML = `<span class="profile-name"><a href="login.html">Login here</a></span>`;
                return null;
            }

            const username = decoded.username;
            const userID = decoded.userID;

            // Fetch user profile to get the image
            let profilePicture = "../images/default-avatar.png"; // default
            try {
                const res = await fetch(`${apiBaseURL}/profile/${userID}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data && data.profilePicture) {
                    profilePicture = data.profilePicture;
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            }

            // Render header with image and name
            userProfile.innerHTML = `
                <img src="${profilePicture}" alt="Profile" id="headerProfilePic" class="header-profile-img" style="width:40px; height:40px; border-radius:50%;">
                <span class="profile-name"><a href="user_profile.html?${userID}">Welcome, ${username}</a></span>
            `;

            return { username, userID, profilePicture };
        } catch (error) {
            console.error("Invalid token:", error);
            userProfile.innerHTML = `<span class="profile-name"><a href="login.html">Login here</a></span>`;
            return null;
        }
    } else {
        userProfile.innerHTML = `<span class="profile-name"><a href="login.html">Login here</a></span>`;
        return null;
    }
}

// Make it accessible globally
window.getToken = getToken;
