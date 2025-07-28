window.addEventListener("load", async() => {
    const authMessage = document.getElementById("authenticate-message");
    const categorySection = document.getElementById("category-section");
    const bookmarkSection = document.getElementById("bookmark-section");
    authMessage.innerHTML = ""
    if(!currentUser){
        authMessage.innerHTML = `<a href="login.HTML">Login to view your bookmarks! </a>`
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
})

getAuthHeaders = function getAuthHeaders(){
    if(!token){
        console.warn("User not authenticated.");
    }
    return{
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    }
}

async function loadBookmarkSection(){
    const allBookmarks = await getAllBookmarks();
    const bookmarkDetails = await getBookmarkDetails(allBookmarks);
    renderBookmarks(bookmarkDetails);
}

// Function to display all categories
async function renderCategories(isEditing){
    const categoryGrid = document.getElementById("category-grid");
    categoryGrid.innerHTML = "";
    const categoryMessage = document.getElementById("category-message");
    categoryMessage.textContent = "Loading Categories..."

    const categories = await fetchCategories();
    if (categories.length == 0){
        categoryMessage.textContent = `You currently have 0 categories`
    }
    categories.forEach(category => {
        console.log(category);
        const categoryCard = document.createElement("div");
        categoryCard.classList.add("category-card");

        const categoryBtn = document.createElement("button");
        categoryBtn.classList.add("category-btn");
        categoryBtn.textContent = category.categoryName;

        categoryCard.appendChild(categoryBtn);

        if(isEditing){
            categoryGrid.classList.add("editing");
            const deleteIcon = document.createElement("img");
            deleteIcon.classList.add("delete-icon");
            deleteIcon.src = "../images/unfilled-delete-icon.png";
            deleteIcon.width = "20";
            deleteIcon.height = "20"

            // Handle hover to swap icon images
            deleteIcon.addEventListener("mouseenter", () => {
            deleteIcon.src = "../images/filled-delete-icon.png";
            });

            deleteIcon.addEventListener("mouseleave", () => {
            deleteIcon.src = "../images/unfilled-delete-icon.png";
            });

            categoryCard.appendChild(deleteIcon);

            deleteIcon.addEventListener("click", async () =>{
                const popup = document.getElementById("delete-popup");
                const popUpMessage = popup.querySelector(".popup-message");
                const yesBtn = popup.querySelector(".yes-btn");
                const noBtn = popup.querySelector(".no-btn");
                const cancelBtn = popup.querySelector(".cancel-btn");

                // Set message and show popup
                popUpMessage.innerHTML = `Are you sure you want to delete <strong>${category.categoryName}</strong>? This action cannot be undone!`;
                popup.style.display = "flex";

                // Clean up old listeners
                yesBtn.replaceWith(yesBtn.cloneNode(true));
                noBtn.replaceWith(noBtn.cloneNode(true));
                cancelBtn.replaceWith(cancelBtn.cloneNode(true));

                const newYesBtn = popup.querySelector(".yes-btn");
                const newNoBtn = popup.querySelector(".no-btn");
                const newCancelBtn = popup.querySelector(".cancel-btn");

                newYesBtn.addEventListener("click", async () => {
                    const bookmarksInCategory = await getAllBookmarks();
                    let count = 0;
                    for (const bookmark of bookmarksInCategory){
                        if(bookmark.categories.includes(category.categoryName)){
                            count ++;
                        }
                    }
                    if(count === 0){
                        await window.deleteCategory(category.categoryID);
                        popUpMessage.textContent = `Successfully deleted ${category.categoryName} from categories!`
                    }else{
                        yesBtn.replaceWith(yesBtn.cloneNode(true));
                        noBtn.replaceWith(noBtn.cloneNode(true));
                        cancelBtn.replaceWith(cancelBtn.cloneNode(true));

                        const newYesBtn = popup.querySelector(".yes-btn");
                        const newNoBtn = popup.querySelector(".no-btn");
                        const newCancelBtn = popup.querySelector(".cancel-btn");

                        const word = count === 1 ? "bookmark" : "bookmarks";
                        popUpMessage.textContent = `We've detected that you have ${count} ${word}\nWould you like to delete them as well?`;
                        newYesBtn.textContent = "Delete them as well";
                        newNoBtn.textContent = "Delete category only"
                        noBtn.style.display = "block";

                        newYesBtn.addEventListener("click", async() => {
                            await 
                        })
                    }
                    categoryCard.remove();
                    
                    // Refresh the list 
                    await renderCategories(isEditing);
                    setTimeout(() => {
                        popUpMessage.textContent = "";
                        popup.style.display = "none";
                    }, 2000);
                });

                newCancelBtn.addEventListener("click", () => {
                    popUpMessage.textContent = `Phew! Thanks for not deleting me (${category.categoryName})`;
                    setTimeout(() => {
                        popUpMessage.textContent = "";
                        popup.style.display = "none";
                    }, 2000);
                });
            })
        }else{
            categoryGrid.classList.remove("editing");
        }
        categoryGrid.appendChild(categoryCard);
    })
    let category = "category";
    if(categories.length > 1){
        category = "categories"
    }
    categoryMessage.textContent = `You currently have ${categories.length} ${category}`;
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
            const errorBody = await response.json();
            throw new(errorBody.message || response.statusText);
        }

        return true;
    }catch(error){
        console.error("Error deleting category: ", error);
        return false;
    }
}

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
async function renderBookmarks(bookmarks){
    const bookmarkMessage = document.getElementById("bookmark-message");
    let bookmarksCount = bookmarks.length;
    try{
        const bookmarkGrid = document.getElementById("bookmark-grid");
        bookmarkGrid.innerHTML = "";
        bookmarkMessage.textContent = "Loading Bookmarks...";
        if(bookmarksCount == 0){
            bookmarkMessage.textContent = `You currently have 0 bookmarks`;
            return;
        }
        for (const bookmark of bookmarks){
            const bookmarkCard = document.createElement("div");
            bookmarkCard.classList.add("bookmark-card");

            bookmarkCard.innerHTML = `
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
            `
            const closeBtn = bookmarkCard.querySelector(".close-btn");
            closeBtn.addEventListener("click", async () => {
                const popup = document.getElementById("delete-popup");
                const popUpMessage = popup.querySelector(".popup-message");
                const yesBtn = popup.querySelector(".yes-btn");
                const cancelBtn = popup.querySelector(".cancel-btn");

                // Set message and show popup
                popUpMessage.innerHTML = `Are you sure you want to delete <strong>${bookmark.name}</strong>? This action cannot be undone!`;
                popup.style.display = "flex";

                // Clean up old listeners
                yesBtn.replaceWith(yesBtn.cloneNode(true));
                cancelBtn.replaceWith(cancelBtn.cloneNode(true));

                const newYesBtn = popup.querySelector(".yes-btn");
                const newCancelBtn = popup.querySelector(".cancel-btn");

                newYesBtn.addEventListener("click", async () => {
                    await window.deleteBookmark(bookmark.bookmarkID);
                    popUpMessage.textContent = `Successfully deleted ${bookmark.name} from bookmarks!`;
                    bookmarkCard.remove();
                    
                    // Refresh the list 
                    await loadBookmarkSection();
                });

                newCancelBtn.addEventListener("click", () => {
                    popUpMessage.textContent = `Phew! Thanks for not deleting me (${bookmark.name})`;
                });

                setTimeout(() => {
                    popUpMessage.textContent = "";
                    popup.style.display = "none";
                }, 2000);
            });
            bookmarkGrid.appendChild(bookmarkCard);

        }
        let bookmark = "bookmark";
        if(bookmarksCount > 1){
            bookmark = "bookmarks"
        }
        bookmarkMessage.textContent = `You currently have ${bookmarksCount} ${bookmark}`;
    }catch(error){
        console.error("Error loading bookmarks", error);
        bookmarkMessage.textContent = `Error loading bookmarks`;
    }
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

