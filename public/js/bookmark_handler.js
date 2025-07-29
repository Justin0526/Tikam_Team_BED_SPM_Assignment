const apiBaseUrl = "http://localhost:3000";
window.filledIcon = "../images/filled-bookmark-icon.png";
window.unfilledIcon = "../images/unfilled-bookmark-icon.png";
let currentUser = null;
window.addEventListener('load', async()=>{
    currentUser = await getToken(token);
})

getAuthHeaders = function getAuthHeaders(){
    if(!token) throw new Error("User not authenticated. ");
    return{
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    }
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

async function isFacilityBookmarked(placeID){
    try{
        const response = await fetch(`${apiBaseUrl}/bookmark/${placeID}`, {
            method: "GET",
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

        if(response.status === 404){
            return false;
        }
        const data = await response.json();
        return data[0];
    }catch(error){
        if(!error.message.includes("404")){
            console.error("Error checking if facility is bookmarked: ", error);
        }
        return false;
    }
}

async function createBookmarkIfNotExists(placeID, placeName){
    try{
        const response = await fetch(`${apiBaseUrl}/bookmark`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({placeID, placeName})
        });

        const data = await response.json();

        if(response.status === 200 || response.status === 201){
            updateBookmarkIcon(placeID, true);
            return data[0];
        }

        throw new Error(data.message || "Unexpected error");
    }catch(error){
        console.error("createBookmarkIfNotExists error: ", error);
        alert("Failed to create bookmark");
        return null;
    }
}

window.createCategoryIfNotExists = async function createCategoryIfNotExists(categoryName){
    try {
        if (!token) {
            alert("You must be signed in to create categories.");
            return null;
        }
        const response = await fetch(`${apiBaseUrl}/category`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({categoryName})
        });
        const data = await response.json();

        if (response.status == 201) {
            const category = data.category;
            if (!category || !category.categoryID) throw new Error("Invalid category response");
            return category;
        } else if (response.status == 409) {
            const categories = await fetchCategories();
            const match = categories.find(c => c.categoryName.toLowerCase() === categoryName.toLowerCase());
            return match?.categoryID ?? null;
        } else {
            throw new Error(`Unexpected response: ${response.status} - ${JSON.stringify(data)}`);
        }

    } catch (error) {
        console.error("Failed to create category:", error);
        alert("Failed to create category");
        return null;
    }
};

async function fetchCategories(){
    try{
        const response = await fetch(`${apiBaseUrl}/categories`, {
            method: "GET",
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

        return await response.json();
    }catch(error){
        console.error("Error fetching categories");
        return [];
    }
}

// Get the photo of the facility
window.fetchPhoto = async function fetchPhoto(placePhoto, maxHeightPx, maxWidthPx) {
    try {
        const urlQuery = `photoName=${placePhoto.name}&maxHeightPx=${maxHeightPx}&maxWidthPx=${maxWidthPx}`;

        const response = await fetch(`${apiBaseUrl}/facilities/photo?${urlQuery}`, {
            method: 'GET',
        });

        if (!response.ok) {
            const errorBody = response.headers
                .get("content-type")
                ?.includes("application/json")
                ? await response.json()
                : { message: response.statusText };

            throw new Error(`HTTP Error! status ${response.status}, message: ${errorBody.message}`);
        }

        // Blob = Binary Large Object. It represents raw binary data like images, videos, pdf files...
        // In the browser, a Blob is a wrapper for binary data so JavaScript can handle it like a normal object
        const blob = await response.blob();
        return URL.createObjectURL(blob); // this is your <img src>
        
    } catch (error) {
        console.error("Error fetching photo", error);
        alert("Failed to load photo");
    }
}

window.assignBookmarkToCategory = async function assignBookmarkToCategory(bookmarkID, categoryID){
    try{
        const response = await fetch(`${apiBaseUrl}/bookmark-category`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({bookmarkID, categoryID})
        })

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
        console.error("Error assigning bookmark to category");
        return false;
    }
}

window.deleteBookmark = async function deleteBookmark(bookmarkID){
    try{
        const response = await fetch(`${apiBaseUrl}/bookmark`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({bookmarkID})
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
        console.error("Error deleting bookmark: ", error);
        return false;
    }
}

window.deleteBookmarksInCategory = async function deleteBookmarksInCategory(categoryID, alsoDeleteBookmarks){
    try{
        const response = await fetch(`${apiBaseUrl}/bookmarks/and/category`,{
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({categoryID, alsoDeleteBookmarks})
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
        console.error("Error deleting boookmarks in category: ", error);
        return false;
    }
}

window.handleBookmarkClick = async function (placeID, placeName){
    const messageDiv = document.getElementById("message");

    if (!token) {
        alert("You must be signed in to create categories.");
        return null;
    }

    // Check if already bookmarked
    const isBookmarked = await isFacilityBookmarked(placeID);
    if(isBookmarked){
        const bookmarkID = isBookmarked.bookmarkID;
        const confirmDelete = confirm(`"${placeName}" is already bookmarked.\nDo you want to remove it?`);
        if (!confirmDelete) return;

        const success = await deleteBookmark(bookmarkID);
        if(success){
            updateBookmarkIcon(placeID, false);
        }else{
            alert("Failed to remove bookmark");
        }
        return
    }

    // Ask for existing category selection or new category
    const categories = await fetchCategories();
    showCategoryModal(categories, async(selectedIDs, newCategoryName) => {
        const categoryIDs = [...selectedIDs];

        // Not bookmarked yet
        const bookmark = await createBookmarkIfNotExists(placeID, placeName);
        const bookmarkID = bookmark.bookmarkID;
        if(!bookmarkID) return;

        if(newCategoryName){
            const newCategory= await createCategoryIfNotExists(newCategoryName);
            const newCategoryID = newCategory.categoryID;
            if(newCategoryID){
                categoryIDs.push(newCategoryID);
                messageDiv.textContent = `Successfully created category: ${newCategoryName}`;
                messageDiv.style.color = "green";
                setTimeout(() => {
                    messageDiv.textContent = "";
                }, 2000);
            }else{
                messageDiv.textContent = "You cannot create an existing category!";
                messageDiv.style.color = "red";
                setTimeout(() => {
                    messageDiv.textContent = "";
                }, 2000);
            } 
        }

        if(categoryIDs.length === 0){
            messageDiv.textContent = `"${placeName}" successfully bookmarked with no category.`;
            messageDiv.style.color = "green";
            updateBookmarkIcon(placeID, true);
            setTimeout(() => {
                messageDiv.textContent = "";
            }, 2000);
            return;
        }

        // Assign bookmark to all selected categories
        let assignedCount = 0;
        for (const categoryID of categoryIDs) {
            const success = await assignBookmarkToCategory(bookmarkID, categoryID);
            if (success) assignedCount++;
        }
        if (assignedCount > 0) {
            let category = "categories";
            if (assignedCount === 1){
                category = "category";
            }
            messageDiv.textContent = `Bookmarked "${placeName}" into ${assignedCount} new ${category}.`;
            messageDiv.style.color = "green";
            updateBookmarkIcon(placeID, true);
        } else {
            messageDiv.textContent = `This bookmark was already in all selected categories.`;
            messageDiv.style.color = "red";
        }

        setTimeout(() => {
            messageDiv.textContent = "";
        }, 2000);
    })
}

window.updateBookmarkIcon = function(placeID, isBookmarked) {
    const icon = document.querySelector(`img[data-place-id="${placeID}"]`);
    if (icon) {
        icon.src = isBookmarked ? window.filledIcon : window.unfilledIcon;
        icon.setAttribute("data-bookmarked", isBookmarked);  // For hover logic
    } else {
        console.warn("Bookmark icon not found for", placeID);
    }
};

function showCategoryModal(categories, onSubmit){
    const modal = document.getElementById("categoryModal");
    const form = document.getElementById("categoryForm");
    const checkboxesDiv = document.getElementById("categoryCheckboxes");
    const newCategoryInput = document.getElementById("newCategory");
    const cancelBtn = document.getElementById("cancelModal");
    const messageDiv = document.getElementById("message");

    messageDiv.textContent = "";

    // Helper to render category checkboxes
    function renderCheckboxes(categoryList) {
        checkboxesDiv.innerHTML = "";
        categoryList.forEach(cat => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = cat.categoryID;
            checkbox.id = `cat-${cat.categoryID}`;

            const label = document.createElement("label");
            label.htmlFor = checkbox.id;
            label.textContent = cat.categoryName;

            const wrapper = document.createElement("div");
            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);

            checkboxesDiv.appendChild(wrapper);
        });
    }

    // Initial render
    renderCheckboxes(categories);

    // Handle Add New Category 
    const addBtn = document.getElementById("addCategoryBtn");
    addBtn.onclick = handleNewCategory;

    async function handleNewCategory(){
        const newCategoryName = newCategoryInput.value.trim();
        if(!newCategoryName) return;

        const newCategory = await createCategoryIfNotExists(newCategoryName);
        const newCategoryID = newCategory.categoryID
        if(newCategoryID){
            categories.push({categoryID: newCategoryID, categoryName: newCategoryName});
            renderCheckboxes(categories); // Refresh with new checkbox
            messageDiv.textContent = `Category "${newCategoryName}" added successfully!`
            messageDiv.style.color = "green";
            setTimeout(() => {
                messageDiv.textContent = "";
            }, 2000);
            newCategoryInput.value = "";
        }else{
            messageDiv.textContent = `Category "${newCategoryName}" has already been created!`
            messageDiv.style.color = "red";
            setTimeout(() => {
                messageDiv.textContent = "";
            }, 2000);
        }
    }

    // Submit selected categories
    form.onsubmit = (e) => {
        e.preventDefault();
        const selectedIDs = Array.from(checkboxesDiv.querySelectorAll("input:checked"))
                            .map(input => parseInt(input.value));
        const newCategory = newCategoryInput.value.trim();
        // Delay modal closing to allow message to show
        setTimeout(() => {
            modal.style.display = "none";
            form.reset();
        }, 2200); // Just after message timeout
            onSubmit(selectedIDs, newCategory || null);
        };

        cancelBtn.onclick = () => {
            modal.style.display = "none";
            form.reset();
    }

    modal.style.display = "flex";
}