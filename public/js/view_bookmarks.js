// Justin Tang Jia Ze S10269496B
window.addEventListener("load", async() => {
    const authMessage = document.getElementById("authenticate-message");
    const categorySection = document.getElementById("category-section");
    const bookmarkSection = document.getElementById("bookmark-section");
    authMessage.innerHTML = ""

    if (!window.currentUser) {
        window.currentUser = await getToken(token);
    }

    const currentUser = window.currentUser;
    if (!currentUser) {
        authMessage.innerHTML = `<a href="login.HTML">Login to view your bookmarks! </a>`;
        return;
    }

    categorySection.style.display = "block";
    bookmarkSection.style.display = "block";

    const bookmarkMessage = document.getElementById("bookmark-message");
    bookmarkMessage.textContent = "Loading Bookmarks...";

    let isEditing = false;
    const editBtn = document.getElementById("edit-category-btn");
    editBtn.addEventListener("click", async () => {
        isEditing = !isEditing;
        editBtn.textContent = isEditing ? "✅ Done" : "✏️ Edit";

        // Re-render categories with edit mode toggle
        await renderCategories(isEditing);
    });
    await renderCategories();
    await loadBookmarkSection();

    const goBtn = document.getElementById("go-btn");
    const textQuery = document.getElementById("textQuery");
    const resultsHeader = document.getElementById("bookmark-section-header");

    goBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const searchTerm = textQuery.value.trim();
        categorySection.style.display = "none";
        resultsHeader.textContent = "";
        authMessage.textContent = ""

        if (!searchTerm) {
            authMessage.textContent = "Please enter a search term! Returning all bookmarks...";
            authMessage.style.color = "red";
            return;
        }

        resultsHeader.textContent = `Results for: ${searchTerm}`;
        const rawResults = await searchBookmark(searchTerm);
        const detailedResults = await getBookmarkDetails(rawResults);
        renderBookmarks(detailedResults);
    });
})

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

// Function to load bookmark section
async function loadBookmarkSection(){
    const allBookmarks = await getAllBookmarks();
    const bookmarkDetails = await getBookmarkDetails(allBookmarks);
    renderBookmarks(bookmarkDetails);
}

// Reset poup buttons
function resetPopupButtons() {
    const popup = document.getElementById("delete-popup");

    const yesBtn = popup.querySelector(".yes-btn");
    const noBtn = popup.querySelector(".no-btn");
    const cancelBtn = popup.querySelector(".cancel-btn");

    const newYesBtn = yesBtn.cloneNode(true);
    const newNoBtn = noBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);

    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    noBtn.parentNode.replaceChild(newNoBtn, noBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newYesBtn.textContent = "Yes";
    newNoBtn.style.display = "none";
    return { newYesBtn, newNoBtn, newCancelBtn };
}

// -------- Categories Functions -------- //
// Function to display all categories
async function renderCategories(isEditing) {
    const categoryGrid = document.getElementById("category-grid");
    const categoryMessage = document.getElementById("category-message");
    const categoryModal = document.getElementById("categoryModal");
    const modalMessage = document.getElementById("modalMessage");

    categoryGrid.innerHTML = "";
    categoryMessage.textContent = "Loading Categories...";

    const categories = await fetchCategories();

    if (categories.length === 0) {
        categoryMessage.textContent = "You currently have 0 categories";
    }

    if (isEditing) categoryGrid.classList.add("editing");
    else categoryGrid.classList.remove("editing");

    categories.forEach(category => {
        const categoryCard = createCategoryCard(category, isEditing);
        categoryGrid.appendChild(categoryCard);
    });

    if (isEditing) {
        const addCard = createAddCategoryCard();
        categoryGrid.appendChild(addCard);
        addCard.addEventListener("click", async() => {
            await handleCategoryModal(modalMessage);
            await renderCategories(true);
        });
    }

    displayCategoryMessage(categories.length, categoryMessage);
}

// Function to create category card
function createCategoryCard(category, isEditing) {
    const card = document.createElement("div");
    card.classList.add("category-card");

    const btn = document.createElement("button");
    btn.classList.add("category-btn");
    btn.textContent = category.categoryName;

    btn.setAttribute("data-category-id", category.categoryID);
    btn.setAttribute("data-category-name", category.categoryName);

    btn.addEventListener("click", () => {
        const categoryID = btn.getAttribute("data-category-id");
        const categoryName = btn.getAttribute("data-category-name");

        window.location.href = `category.html?categoryID=${categoryID}&categoryName=${encodeURIComponent(categoryName)}`;
    });

    card.appendChild(btn);

    if (isEditing) {
        const deleteIcon = document.createElement("img");
        deleteIcon.classList.add("delete-icon");
        deleteIcon.src = "../images/unfilled-delete-icon.png";
        deleteIcon.width = 20;
        deleteIcon.height = 20;

        deleteIcon.addEventListener("mouseenter", () => {
            deleteIcon.src = "../images/filled-delete-icon.png";
        });
        deleteIcon.addEventListener("mouseleave", () => {
            deleteIcon.src = "../images/unfilled-delete-icon.png";
        });
        deleteIcon.addEventListener("click", () =>
            handleDeleteCategoryPopup(category, isEditing)
        );

        card.appendChild(deleteIcon);
    }

    return card;
}

// Function to display category messages
function displayCategoryMessage(count, categoryMessage) {
    const word = count === 1 ? "category" : "categories";
    categoryMessage.textContent = `You currently have ${count} ${word}`;
}

// Function to handle Delete Category, when a pop up appears
async function handleDeleteCategoryPopup(category, isEditing) {
    const popup = document.getElementById("delete-popup");
    const popUpMessage = popup.querySelector(".popup-message");

    const { newYesBtn, newNoBtn, newCancelBtn } = resetPopupButtons();

    const categoryID = category.categoryID;
    const categoryName = category.categoryName;

    popUpMessage.innerHTML = `Are you sure you want to delete <strong>${categoryName}</strong>? This action cannot be undone!`;
    popUpMessage.style.color = "black";
    popup.style.display = "flex";

    newYesBtn.addEventListener("click", async () => {
        const bookmarksInCategory = await getAllBookmarks();
        const count = bookmarksInCategory.filter(bookmark => {
            const categoryList = bookmark.categories
                ? bookmark.categories.split(",").map(c => c.trim())
                : [];
            return categoryList.some(cat => cat === categoryName);
        }).length;

        if (count === 0) {
            await confirmDeleteCategoryOnly(categoryID, categoryName, popUpMessage, popup, isEditing);
        } else {
            await handleBookmarksExistPrompt(count, categoryID, categoryName, popUpMessage, popup, newYesBtn, newNoBtn, newCancelBtn, isEditing);
        }
    });

    newCancelBtn.addEventListener("click", () => {
        document.getElementById("delete-popup").querySelector(".no-btn").style.display = "none";
        popUpMessage.textContent = `Phew! Thanks for not deleting me (${categoryName})`;
        setTimeout(() => {
            popUpMessage.textContent = "";
            popup.style.display = "none";
        }, 2000);
    });
}

// Function to delete category when there no bookmark in the category
async function confirmDeleteCategoryOnly(categoryID, categoryName, popUpMessage, popup, isEditing) {
    try {
        await window.deleteCategory(categoryID);
        popUpMessage.textContent = `Successfully deleted ${categoryName} from categories!`;
        popUpMessage.style.color = "green";
        await renderCategories(isEditing);
        await loadBookmarkSection();
    } catch {
        popUpMessage.textContent = `Failed to delete ${categoryName}`;
        popUpMessage.style.color = "red";
    } finally {
        const noBtn = document.getElementById("delete-popup").querySelector(".no-btn");
        setTimeout(() => {
            popUpMessage.textContent = "";
            popup.style.display = "none";
        }, 2000);
        noBtn.style.display = "none";
    }
}

// Function to prompt user when there is bookmarks in the category they are going to delete
async function handleBookmarksExistPrompt(count, categoryID, categoryName, popUpMessage, popup, yesBtn, noBtn, cancelBtn, isEditing) {
    const word = count === 1 ? "bookmark" : "bookmarks";
    popUpMessage.textContent = `We've detected that you have ${count} ${word} in this category.\nWould you like to delete them as well?`;
    yesBtn.textContent = "Delete them as well";
    noBtn.textContent = "Delete category only";
    noBtn.style.display = "block";

    yesBtn.addEventListener("click", async () => {
        await deleteCategoryAndBookmarks(categoryID, categoryName, count, word, popUpMessage, popup, isEditing);
    });

    noBtn.addEventListener("click", async () => {
        await deleteCategoryOnlyPreserveBookmarks(categoryID, categoryName, popUpMessage, popup, isEditing);
    });

    cancelBtn.addEventListener("click", () => {
        document.getElementById("delete-popup").querySelector(".no-btn").style.display = "none";
        popUpMessage.textContent = `Phew! Thanks for not deleting me (${categoryName})`;
        setTimeout(() => {
            popUpMessage.textContent = "";
            popup.style.display = "none";
        }, 2000);
    });
}

// Function to delete category and bookmarks
async function deleteCategoryAndBookmarks(categoryID, categoryName, count, word, popUpMessage, popup, isEditing) {
    try {
        await window.deleteBookmarksInCategory(categoryID, true);
        popUpMessage.textContent = `Category ${categoryName} and ${count} ${word} have been deleted successfully`;
        popUpMessage.style.color = "green";
        await renderCategories(isEditing);
        await loadBookmarkSection();
    } catch {
        popUpMessage.textContent = `Failed to delete category ${categoryName} and ${count} ${word}`;
        popUpMessage.style.color = "red";
    } finally {
        const noBtn = document.getElementById("delete-popup").querySelector(".no-btn");
        setTimeout(() => {
            popUpMessage.textContent = "";
            popup.style.display = "none";
        }, 2000);
        noBtn.style.display = "none";
    }
}

// Function to delete only the category and not the bookmarks
async function deleteCategoryOnlyPreserveBookmarks(categoryID, categoryName, popUpMessage, popup, isEditing) {
    try {
        await window.deleteBookmarksInCategory(categoryID, false);
        popUpMessage.textContent = `Category ${categoryName} has been deleted successfully`;
        popUpMessage.style.color = "green";
        await renderCategories(isEditing);
        await loadBookmarkSection();
    } catch {
        popUpMessage.textContent = `Failed to delete category ${categoryName}`;
        popUpMessage.style.color = "red";
    } finally {
        const noBtn = document.getElementById("delete-popup").querySelector(".no-btn");
        setTimeout(() => {
            popUpMessage.textContent = "";
            popup.style.display = "none";
        }, 2000);
        noBtn.style.display = "none";
    }
}

// Delete category
async function deleteCategory(categoryID){
    try{
        const response = await fetch(`${apiBaseUrl}/category`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({categoryID})
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

        return true;
    }catch(error){
        console.error("Error deleting category: ", error);
        return false;
    }
}

// Function to create add category card
function createAddCategoryCard() {
    const addCard = document.createElement("div");
    addCard.classList.add("category-card");

    const addBtn = document.createElement("button");
    addBtn.classList.add("add-category-btn");
    addBtn.textContent = "Add new Category +";

    addCard.appendChild(addBtn);
    return addCard;
}

// Function to create new category
async function createNewCategory(categoryName, modalMessage){
    try{
        const newCategory = await window.createCategoryIfNotExists(categoryName);
        console.log(newCategory);
        const newCategoryID = newCategory.categoryID;

        if(newCategoryID){
            modalMessage.textContent = `Successfully created category: "${categoryName}"`;
            modalMessage.style.color = "green";
            return true;
        }else{
            modalMessage.textContent = `Category "${categoryName}" already exists!`;
            modalMessage.style.color = "red";
            return false;
        }
    }catch(error){
        modalMessage.textContent = `Failed to create category: ${categoryName}`;
        modalMessage.style.color = "red";
        console.error("Error creating category: ", error);
        return false;
    }
}

// Function to handle category modal
async function handleCategoryModal(modalMessage){
    const modalOverlay = document.getElementById("categoryModal");
    const categoryInput = document.getElementById("newCategory");
    const confirmBtn = document.getElementById("confirmModal");
    const cancelBtn = document.getElementById("cancelModal");

    modalOverlay.style.display = "flex";
    modalMessage.textContent = "";
    modalMessage.style.color = "black"
    categoryInput.value = "";
    categoryInput.focus();

    // Remove old listeners
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));

    const newConfirmBtn = document.getElementById("confirmModal");
    const newCancelBtn = document.getElementById("cancelModal");

    newConfirmBtn.addEventListener("click", async(event) =>{
        event.preventDefault();
        const name = categoryInput.value.trim();
        if(!name){
            modalMessage.textContent = "Category name cannot be empty.";
            modalMessage.style.color = "red";
            return;
        }

        const success = await createNewCategory(name, modalMessage);
        if(success){
            categoryInput.value = "";
            modalMessage.textContent += "\nYou can add more or press Cancel to exit.";
        }
    });

    newCancelBtn.addEventListener("click", ()=>{
        modalOverlay.style.display = "none";
        modalMessage.textContent = "";
        categoryInput.value = "";
    });
}

// -------------------------------------- //

// -------- Bookmarks Functions -------- //
// Get all bookmarks
async function getAllBookmarks(){
    try{
        const response = await fetch(`${apiBaseUrl}/bookmarks`, {
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
        console.error("Error fetching all bookmarks");
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
        bookmarkMessage.textContent = "You currently have 0 bookmarks";
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
    bookmarkMessage.textContent = `You currently have ${count} ${word}`;
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
    console.log(bookmark)
    let category = bookmark.categories;
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

// ------------------------------------- //
