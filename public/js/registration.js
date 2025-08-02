const registerForm = document.getElementById("register-form");  
const message = document.getElementById("message");
const apiBaseUrl = "http://localhost:3000";

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "";

    const fullNameInput = document.getElementById('fullname');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // ✅ Password Criteria Regex: At least 6 chars, 1 uppercase, 1 special character
    const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;

    // ✅ Frontend Validation
    if (!passwordPattern.test(password)) {
        message.textContent = 
            "Password must be at least 6 characters long and include at least 1 uppercase letter and 1 special character.";
        message.style.color = "red";
        return;
    }

    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        message.style.color = "red";
        return;
    }

    const newUser = {
        fullName: fullNameInput.value.trim(),
        username: usernameInput.value.trim(),
        email: emailInput.value.trim(),
        password: password,
        confirmPassword: confirmPassword
    };

    try {
        // Make a POST request to the API endpoint
        const response = await fetch(`${apiBaseUrl}/register`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json", // Tell the API we are sending JSON
            },
            body: JSON.stringify(newUser), // Send the data as JSON string in the request body
        });

        const responseBody = response.headers
          .get("content-type")
          ?.includes("application/json")
          ? await response.json()
          : { message: response.statusText };

        if (response.status === 201) {
            message.textContent = "Account created successfully! Redirecting to login...";
            message.style.color = "green";
            registerForm.reset();
            console.log("Created user: ", responseBody);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else if (response.status === 400) {
            message.textContent = `Validation Error: ${responseBody.message}`;
            message.style.color = 'red';
            console.error("Validation error: ", responseBody);
        } else {
            throw new Error(
                `API error! status: ${response.status}, message: ${responseBody.message}`
            );
        }
    } catch (error) {
        console.error("Error creating user: ", error);
        message.textContent = `Failed to create user: ${error.message}`;
        message.style.color = 'red';
    }
});
