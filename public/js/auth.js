const token = localStorage.getItem("authToken");
const userProfile = document.getElementById("user-profile");

async function getToken(token){
    if (token){     
        try{
            const decoded = jwt_decode(token);
            const currentTime = Math.floor(Date.now()/1000); // Get in seconds

            if(decoded.exp && decoded.exp < currentTime){
                // Token has expired
                console.warn("Token exipred");
                localStorage.removeItem("authToken");
                userProfile.innerHTML = `<span class="profile-name"><a href="login.html">Login here</a></span>`;
                return null;
            }

            const username = decoded.username;
            const userID = decoded.userID;

            userProfile.innerHTML = `
                <div class="profile-pic"></div>
                <span class="profile-name"><a href="profile.html?${userID}">Welcome,  ${username}</a></span>
            `;  

            return {username: username, userID: userID};
        } catch(error){
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