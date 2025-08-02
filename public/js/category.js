// Justin Tang Jia Ze S10269496B
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

    reloadBookmarkSection()

    const editBtn = document.getElementById("edit-category-btn");
    editBtn.addEventListener("click", () => {
        showEditCategoryModal(categoryName, categoryID);
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

// reload bookmarks
async function reloadBookmarkSection() {
    const bookmarkMessage = document.getElementById("bookmark-message");
    bookmarkMessage.textContent = "Refreshing bookmarks...";

    const bookmarks = await getBookmarksFromCategory(categoryID);
    const bookmarkDetails = await getBookmarkDetails(bookmarks);
    renderBookmarks(bookmarkDetails);
}

// Function to reset popup buttons
function resetPopupButtons() {
    const popup = document.getElementById("delete-popup");

    const yesBtn = popup.querySelector(".yes-btn");
    const cancelBtn = popup.querySelector(".cancel-btn");

    const newYesBtn = yesBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);

    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    return { newYesBtn, newCancelBtn };
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

async function deleteBookmarkFromCategory(bookmarkID, categoryID){
    try{
        const response = await fetch(`${apiBaseUrl}/bookmark-category`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({bookmarkID, categoryID})
        });

        if(!response.ok){
            const errorBody = response.headers
                .get("content-type")
                ?.includes("application/json")
                ? await response.json()
                : {message: response.statusText};
            throw new Error(
                `HTTP Error! status ${response.status}, message: ${errorBody.message}`
            );
        }

        return true;
    }catch(error){
        console.error("Error deleting bookmark from category: ", error);
        return false;
    }
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
            const success = await deleteBookmarkFromCategory(bookmark.bookmarkID, categoryID);
            if (success) {
                popUpMessage.textContent = `Successfully removed ${bookmark.name} from this category!`;
                await reloadBookmarkSection();
            } else {
                popUpMessage.textContent = `Failed to remove ${bookmark.name} from this category.`;
            }

            setTimeout(() => {
                popUpMessage.textContent = "";
                popup.style.display = "none";
            }, 1000);
        });

        newCancelBtn.addEventListener("click", () => {
            popUpMessage.textContent = `Phew! Thanks for not deleting me (${bookmark.name})`;
            setTimeout(() => {
                popUpMessage.textContent = "";
                popup.style.display = "none";
            }, 1000);
        });
    });
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

        const data = await response.json();
        return { status: response.status, data }; 
    }catch(error){
        console.error("Error updating category name");
        return { status: 500, data: null };;
    }
}

function showEditCategoryModal(categoryName, categoryID) {
    const modal = document.getElementById("editCategoryModal");
    const form = document.getElementById("editCategoryForm");
    const checkboxesDiv = document.getElementById("bookmarkCheckboxes");
    const input = document.getElementById("updatedCategory");
    const message = document.getElementById("editModalMessage");
    const addBtn = document.getElementById("addBookmarksBtn");
    const updateBtn = document.getElementById("updateCategoryBtn");
    const cancelBtn = document.getElementById("cancelEdit");

    input.value = categoryName;
    message.textContent = "";
    modal.style.display = "flex";

    fetch(`${apiBaseUrl}/bookmarks`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(async allBookmarks => {
            const existing = await getBookmarksFromCategory(categoryID);
            const existingIDs = new Set(existing.map(b => b.bookmarkID));
            const toAdd = allBookmarks.filter(b => !existingIDs.has(b.bookmarkID));

            checkboxesDiv.innerHTML = toAdd.length === 0
            ? "<p style='color:gray;'>All bookmarks are already in this category.</p>"
            : toAdd.map(b => `
                <div class="checkbox-row">
                    <input type="checkbox" value="${b.bookmarkID}" id="bm-${b.bookmarkID}">
                    <label for="bm-${b.bookmarkID}">${b.placeName}</label>
                </div>
                `).join('');

        });

    addBtn.onclick = async (e) => {
        e.preventDefault();
        const selected = Array.from(checkboxesDiv.querySelectorAll("input:checked")).map(c => parseInt(c.value));
        let count = 0;
        for (const id of selected) {
            if (await assignBookmarkToCategory(id, categoryID)) count++;
        }
        message.textContent = count ? `${count} bookmarks added.` : "No bookmarks added.";
        message.style.color = count ? "green" : "red";
        reloadBookmarkSection();
    };

    updateBtn.onclick = async () => {
        const newName = input.value.trim();
        if (!newName) {
            message.textContent = "Category name cannot be empty.";
            message.style.color = "red";
            return;
        }

        const { status, data } = await updateCategoryName(newName, categoryID);
        if (status === 409) {
            message.textContent = "Category name already exists.";
            message.style.color = "red";
        } else if (status === 200) {
            message.textContent = "Category updated.";
            message.style.color = "green";
            categoryName = data[0].categoryName;
            document.getElementById("category-h2").textContent = `Bookmarks for ${categoryName}`;
            window.history.replaceState({}, '', `?categoryID=${categoryID}&categoryName=${encodeURIComponent(categoryName)}`);
        } else {
            message.textContent = "Update failed.";
            message.style.color = "red";
        }
    };

    cancelBtn.onclick = () => {
        modal.style.display = "none";
        form.reset();
    };
}


