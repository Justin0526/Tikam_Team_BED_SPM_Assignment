//Log out and remove token to make sure the user cannot login using the same token anymore
function logout() {
    localStorage.removeItem("authToken");
    window.location.href = "login.html";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
      logoutLink.addEventListener("click", function (e) {
        e.preventDefault(); // prevent default navigation
        logout();
      });
    }
  });