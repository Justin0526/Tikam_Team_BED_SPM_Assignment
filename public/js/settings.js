//Log out and remove token to make sure the user cannot login using the same token anymore
document.addEventListener("DOMContentLoaded", async () => {
  const logoutLink = document.getElementById("logoutLink");
  const token = localStorage.getItem("authToken");

  const currentUser = await getToken(token); // Already checks expiration, validity, etc.

  if (!currentUser && logoutLink) {
    // User not logged in → hide logout
    logoutLink.style.display = "none";
  } else if (currentUser && logoutLink) {
    // User is logged in → attach logout event
    logoutLink.style.display = "block";
    logoutLink.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("authToken");
      alert("You’ve been logged out.");
      window.location.href = "login.html";
    });
  }
});
