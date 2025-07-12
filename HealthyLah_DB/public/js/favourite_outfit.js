const apiBaseUrl = "http://localhost:3000";
let currentUser = null;

const message = document.getElementById("message");
const outfitGrid = document.getElementById("outfit-grid");

const popup = document.getElementById("popup");
const closePopup = document.getElementById("close-btn");

async function getFavouriteOutfits(){
    try{
        outfitGrid.innerHTML = "Loading outfits...";
        message.textContent = "";

        if(!currentUser || currentUser == null){
            outfitGrid.innerHTML = `<a href="login.HTML">Login to view your favourite outfits! </a>`
            return;
        }

        console.log(currentUser);

        // Make a GET request to the API endpoint
        const response = await fetch(`${apiBaseUrl}/favouriteOutfit`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if(!response.ok){
            // Handle HTTP errors (e.g. 404, 500)
            // Attempt to read erroro body if available, otherwise use status text
            const errorBody = response.headers
              .get("content-type")
              ?.includes("application/json")
              ? await response.json()
              : {message: response.statusText};
            throw new Error(
                `HTTP Error! status ${response.status}, message: ${errorBody.message}`
            );
        }

        const outfits = await response.json();

        // Clear previous message
        outfitGrid.innerHTML = "";
        if(outfits.length === 0 || !outfits){
            outfitGrid.innerHTML = "<p>You currently have no favourite outfits</p>"
        }
        else{
            outfits.forEach((outfit)=>{
                const outfitCard = document.createElement("div");
                outfitCard.classList.add("outfit-card");
                // Use data attributes or similar to store ID on the element if needed later
                outfitCard.setAttribute("data-outfit-id", outfit.favouriteOutfitID)
                
                // format date
                // Create a date object in vanilla js first
                const date = new Date(outfit.favouriteDateTime);
                // en-GB set the date to day month year, en-US sets to month day, year
                const formattedDate = date.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })

                // Get other attributes
                const outfitImage = outfit.outfitImageURL;
                const outfitName = outfit.outfitName

                outfitCard.innerHTML = `
                    <img class="outfit-image" src="${outfitImage}" alt="image">
                    <div class="outfit-name">${outfitName}</div>
                    <div class="outfit-date">Favourited on: ${formattedDate}</div>
                `;

                // Show popup when any outfit card is clicked
                outfitGrid.appendChild(outfitCard);

                outfitCard.addEventListener('click', ()=>{
                    // Clear popup first
                    popup.innerHTML = '';

                    // Append outfit details for popup
                    const popupCard = document.createElement("div");
                    popupCard.classList.add("popup-card");

                    popupCard.innerHTML = `
                        <span class="close-btn" id="close-btn">x</span>
                        <div class="popup-content">
                            <img class="popup-image" src="${outfitImage}" alt="image">
                            <div class="popup-text">
                                <p>${outfit.outfitDesc}</p>
                                <p class="popup-date">Favourited on: ${formattedDate}</p>
                                <button class="unlike-btn" data-id="${outfit.favouriteOutfitID}">💔 Unlike outfit</button>
                            </div>
                        </div>
                        <p class="popup-name">${outfitName}</p>
                    `;
                    popup.appendChild(popupCard);
                    popup.style.display = 'flex';

                    // Add event listeners for unlike button after they are added to the DOM
                    const unlikeButton = popupCard.querySelector(".unlike-btn");
                    unlikeButton.addEventListener("click", (event) =>{
                        unlikeFavouriteOutfit(event, outfitCard);
                    });
                });
            });
        }

    }catch(error){
        console.error("Error fetching favourite otufits", error);
    }
}
// Close popup
popup.addEventListener("click", (event)=>{
    if(event.target.classList.contains("close-btn")){
        popup.style.display = "none";
    }
})

// Unlike outfit
async function unlikeFavouriteOutfit(event, outfitCard){
    const favouriteOutfitID = event.target.getAttribute("data-id");
    console.log("Attempting to delete favourite outfit with ID: ", favouriteOutfitID);
    alert(`Attempting to delete outfit`);

    try{
        const response = await fetch(`${apiBaseUrl}/favouriteOutfit/${favouriteOutfitID}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const responseBody = response.headers
          .get("content-type")
          ?. includes("application/json")
          ? await response.json()
          : {message: response.statusText};
        
        if(response.status === 204){
            message.textContent = "Outfit deleted successfully!";
            message.style.color = "green";

            // On successful deletion, remove the book element from the DOM
            if(outfitCard){
                outfitCard.remove();
            }
            setTimeout(() =>{
                message.textContent = "";
            }, 2000);

        }
        else if(response.status === 404){
            message.textContent = `Validation Error: ${responseBody.message}`;
            message.style.color = "red";
            console.error("Validation Error: ", response.headers);
        }
        else{
            // Other potential API errors (e.g. 500)
            throw new Error(
                `API error! status: ${response.status}, message: ${responseBody.message}`
            );
        }
    }catch(error){
        console.error("Error deleting outfit: ", error);
        message.textContent = `Failed to delete outfit: ${error.message}`;
        message.style.color = "red";
    }
}
    
window.addEventListener('load', async ()=> {
    currentUser = await getToken(token);
    getFavouriteOutfits();
})