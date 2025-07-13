const registerForm = document.getElementById("register-form");  
const message = document.getElementById("message");
const apiBaseUrl = "http://localhost:3000";

registerForm.addEventListener("submit", async(event) => {
    event.preventDefault();

    message.textContent = "";

    const fullNameInput = document.getElementById('fullname');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    const newUser = {
        fullName: fullNameInput.value.trim(),
        username: usernameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        confirmPassword: confirmPasswordInput.value 
    }

    try{
        // Make a POST request to the API endpoint
        const response = await fetch(`${apiBaseUrl}/register`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json", // Tell the API we are sending JSON
            },
            body: JSON.stringify(newUser), // Send the data as Json string in the request body
        });

        // Check for API response status (201, 400, 500)
        const responseBody = response.headers
          .get("content-type")
          ?. includes("application/json")
          ? await response.json()
          :{message: response.statusText};
        
        if (response.status === 201){
            message.textContent = "Account created successfully! Redirecting to login";
            message.style.color = "green";
            registerForm.reset(); // Clear the form after success
            console.log("Created user: ", responseBody);
            setTimeout(() => {
                window.location.href = 'login.html'; // redirect after 2s
            }, 2000);
        }
        else if (response.status === 400){
            // Handle validation errors from API 
            message.textContent = `Validation Error: ${responseBody.message}`;
            message.style.color = 'red';
            console.error("Validation error: ", responseBody);
        }
        else{
            // Handle other potential API errors (e.g. 500 from error handling middleware)
            throw new Error(
                `API error! status: ${response.status}, message: ${responseBody.message}`
            )
        }
    }catch(error){
        console.error("Error creating user: ", error);
        message.textContent = `Failed to create user ${error.message}`;
        message.style.color = 'red';
    }
})
