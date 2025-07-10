const loginForm = document.getElementById("login-form");
const message = document.getElementById("message");
const apiBaseUrl = "http://localhost:3000";

loginForm.addEventListener('submit', async(event) => {
    event.preventDefault();
    message.textContent = "";
    
    const username = document.getElementById("username");
    const password = document.getElementById("password");

    const loginUser = {
        username: username.value.trim(),
        password: password.value
    }

    try{
        const response = await fetch(`${apiBaseUrl}/login`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json", // Tell API we are sending JSON
            },
            body: JSON.stringify(loginUser), // Send the data as JSON string in the request body
        });

        // Check for API response status (201, 400, 500)
        const responseBody = response.headers
          .get("content-type")
          ?. includes("application/json")
          ? await response.json()
          :{message: response.statusText};
        
        if (response.status === 200){
            message.textContent = "Login successful! Redirecting to home page";
            message.style.color = "green";
            loginForm.reset(); // Clear the form after success
            console.log("Created user: ", responseBody);
            setTimeout(() => {
                window.location.href = 'index.html'; // redirect after 2s
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
            throw new Error (
                `API error! status: ${response.status}, message: ${responseBody.message}`
            )
        }
    }catch(error){
        console.error("Error logging in: ", error);
        message.textContent = `Failed to login ${error.message}`;
        message.style.color = 'red';
    }

})

