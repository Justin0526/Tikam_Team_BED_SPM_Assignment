let categoryName; // GLOBAL category name (so we can update it anywhere)

const params = new URLSearchParams(window.location.search);
const categoryID = params.get("categoryID");
categoryName = params.get("categoryName"); // assign to global

window.addEventListener("load", async () => {
    const bookmarkSection = document.getElementById("bookmark-section");
    const categorySection = document.getElementById("category-section");
    if (!currentUser) {
        authMessage.innerHTML = `<a href="login.HTML">Login to view your bookmarks! </a>`;
        return;
    }
    categorySection.style.display = "block";
    bookmarkSection.style.display = "block";

    const bookmarkMessage = document.getElementById("bookmark-message");
    bookmarkMessage.textContent = "Loading Bookmarks...";

    const categoryH2 = document.getElementById("category-h2");
    categoryH2.textContent = `Bookmarks for ${categoryName}`;

    const bookmarks = await getBookmarksFromCategory(categoryID);
    const bookmarkDetails = await getBookmarkDetails(bookmarks);
    renderBookmarks(bookmarkDetails);

    const editBtn = document.getElementById("edit-category-btn");
    editBtn.addEventListener("click", () => {
        showUpdateCategoryModal(categoryName, categoryID);
    });
});


// Get Headers for requests
getAuthHeaders = function getAuthHeaders(){
    if(!token){
        console.warn("User not authenticated.");
    }
    return{
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    }
}

// Get bookmarks from categories
async function getBookmarksFromCategory(categoryID){
    try{
        const response = await fetch(`${apiBaseUrl}/bookmark-category/category/${categoryID}`, {
            headers: getAuthHeaders(),
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
        const bookmarks = await response.json();
        return bookmarks;
    }catch(error){
        console.error("Error fetching bookmarks from category");
        return [];
    }
}

// Get bookmark details from google api and database
async function getBookmarkDetails(bookmarks){
    const detailedBookmarks = [];
    console.log(bookmarks)
    for (const bookmark of bookmarks){
        const placeID = bookmark.placeID;
            
        try{
            // Fetch Google Place Details
            const googleResponse = await fetch(`${apiBaseUrl}/facilities/${placeID}`, {
                method: "GET",
                headers: getAuthHeaders()
            });
            
            if (!googleResponse.ok) {
                const errorBody = googleResponse.headers
                    .get("content-type")
                    ?.includes("application/json")
                    ? await googleResponse.json()
                    : { message: googleResponse.statusText };
                throw new Error(
                    `HTTP Error! status ${googleResponse.status}, message: ${errorBody.message}`
                );
            }

            const googleData = await googleResponse.json();
            const detailed = await convertToDetailedBookmark(bookmark, googleData);
            detailedBookmarks.push(detailed);
        } catch(error){
            console.error(`Error fetching details for placeID ${placeID}: `, error)
        }
    }
    return detailedBookmarks;   
    
}

// Function to display all bookmarks
async function renderBookmarks(bookmarks) {
    const bookmarkGrid = document.getElementById("bookmark-grid");
    const bookmarkMessage = document.getElementById("bookmark-message");

    bookmarkGrid.innerHTML = "";
    bookmarkMessage.textContent = "Loading Bookmarks...";

    if (!bookmarks || bookmarks.length === 0) {
        bookmarkMessage.textContent = "You currently have 0 bookmarks in this category";
        return;
    }

    for (const bookmark of bookmarks) {
        const bookmarkCard = createBookmarkCard(bookmark);
        attachDeletePopup(bookmarkCard, bookmark);
        bookmarkGrid.appendChild(bookmarkCard);
    }

    displayBookmarkMessage(bookmarks.length, bookmarkMessage);
}

// Function to create bookmark card
function createBookmarkCard(bookmark) {
    const card = document.createElement("div");
    card.classList.add("bookmark-card");

    card.innerHTML = `
        <span class="close-btn">❌</span>
        <div class="bookmark-img">
            ${bookmark.photo}
        </div>
        <div class="bookmark-content">
            <h3 class="bookmark-title" data-bookmark-id="${bookmark.bookmarkID}">${bookmark.name}</h3>
            <p><strong>Address:</strong> ${bookmark.address}</p>
            <p><strong>Open Now:</strong> ${bookmark.openNow}</p>
            <p class="category-line"><strong>Category:</strong> ${bookmark.category}</p>
            <p><strong>Bookmarked Date:</strong> ${bookmark.bookmarkedDate}</p>
            <div class="bookmark-footer">
                <a href="${bookmark.mapsLink}" class="bookmark-link" target="_blank">Take me there➤</a>
            </div>
        </div>
    `;
    return card;
}

// Function to handle popup when deleting bookmarks
function attachDeletePopup(bookmarkCard, bookmark) {
    const closeBtn = bookmarkCard.querySelector(".close-btn");

    closeBtn.addEventListener("click", () => {
        const popup = document.getElementById("delete-popup");
        const popUpMessage = popup.querySelector(".popup-message");

        const { newYesBtn, newCancelBtn } = resetPopupButtons();

        popUpMessage.innerHTML = `Are you sure you want to delete <strong>${bookmark.name}</strong>? This action cannot be undone!`;
        popup.style.display = "flex";

        newYesBtn.addEventListener("click", async () => {
            await window.deleteBookmark(bookmark.bookmarkID);
            popUpMessage.textContent = `Successfully deleted ${bookmark.name} from bookmarks!`;
            bookmarkCard.remove();
            await loadBookmarkSection();
            setTimeout(() => {
                popUpMessage.textContent = "";
                popup.style.display = "none";
            }, 2000);
        });

        newCancelBtn.addEventListener("click", () => {
            popUpMessage.textContent = `Phew! Thanks for not deleting me (${bookmark.name})`;
            setTimeout(() => {
                popUpMessage.textContent = "";
                popup.style.display = "none";
            }, 2000);
        });
    });
}

// Function to search bookmark
async function searchBookmark(searchTerm){
    try{
        const response = await fetch(`${apiBaseUrl}/search/bookmarks?searchTerm=${searchTerm}`,{
            method: 'GET',
            headers: getAuthHeaders()
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
        const bookmarks = await response.json();
        return bookmarks;
    }catch(error){
        console.error("Error searching bookmarks");
        return [];
    }
}

// Function to display bookmark message
function displayBookmarkMessage(count, bookmarkMessage) {
    const word = count === 1 ? "bookmark" : "bookmarks";
    bookmarkMessage.textContent = `You currently have ${count} ${word} in this category`;
}

// Fucntion to formateDate
function formatDate(isoString) {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Function to see accessibility from google api
function interpretAccessibility(options) {
    if (!options) return "Not wheelchair accessible";

    const allTrue = Object.values(options).every(value => value === true);
    return allTrue ? "Wheelchair-friendly" : "Not wheelchair accessible";
}

// Functino to merge all data into one bookmark
async function convertToDetailedBookmark(bookmark, placeData) {
    let category = bookmark.categoryName;
    if(!category){
        category = "Uncategorised"
    }
    const placePhoto = placeData.photos;
    let placePhotoHTML = "No Picture Available";
    if(placePhoto){
        try{
            const imageURL = await window.fetchPhoto(placePhoto[0], 400, 300);
            placePhotoHTML = `<img src="${imageURL}" alt="Picture">`
        }catch(error){
            console.warn("Photo fetch failed, showing original.");
        }
    }
    return {
        bookmarkID: bookmark.bookmarkID,
        placeID: bookmark.placeID,
        category: category,
        bookmarkedDate: formatDate(bookmark.bookmarkedAt),
        name: placeData.displayName?.text || "Unknown",
        address: placeData.formattedAddress || "No address available",
        openNow: placeData.currentOpeningHours?.openNow ? "Open" : "Closed",
        accessibility: interpretAccessibility(placeData.accessibilityOptions),
        mapsLink: placeData.googleMapsLinks?.placeUri || "#",
        photo: placePhotoHTML
    };
}

async function updateCategoryName(newCategoryName, categoryID) {
    try{
        const response = await fetch(`${apiBaseUrl}/category`,{
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({categoryID, newCategoryName})
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
        const newName = await response.json();
        return newName;
    }catch(error){
        console.error("Error updating category name");
        return;
    }
}

function showUpdateCategoryModal(currentName, categoryID) {
    const modal = document.getElementById("updateCategoryModal");
    const input = document.getElementById("updatedCategory");
    const message = document.getElementById("updateModalMessage");
    const confirmBtn = document.getElementById("confirmUpdate");
    const cancelBtn = document.getElementById("cancelUpdate");

    modal.style.display = "flex";
    input.value = currentName;
    input.focus();
    message.textContent = "";

    // Remove old listeners
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));

    const newConfirmBtn = document.getElementById("confirmUpdate");
    const newCancelBtn = document.getElementById("cancelUpdate");

    newConfirmBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const newName = input.value.trim();
        if (!newName) {
            message.textContent = "Category name cannot be empty.";
            message.style.color = "red";
            return;
        }

        const result = await updateCategoryName(newName, categoryID);
        if (result) {
            categoryName = result[0].categoryName; // ✅ update global

            message.textContent = "Category updated successfully!";
            message.style.color = "green";

            const categoryH2 = document.getElementById("category-h2");
            categoryH2.textContent = `Bookmarks for ${categoryName}`; // use updated global

            window.history.replaceState({}, '', `?categoryID=${categoryID}&categoryName=${encodeURIComponent(categoryName)}`);

            setTimeout(() => {
                modal.style.display = "none";
            }, 1000);
        } else {
            message.textContent = "Failed to update category.";
            message.style.color = "red";
        }
    });

    newCancelBtn.addEventListener("click", () => {
        modal.style.display = "none";
        input.value = "";
        message.textContent = "";
    });
}
