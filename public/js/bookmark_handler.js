const apiBaseURL = "http://localhost:3000";
window.filledIcon = "../images/filled-bookmark-icon.png";
window.unfilledIcon = "../images/unfilled-bookmark-icon.png";
let currentUser = null;
window.addEventListener('load', async()=>{
    currentUser = await getToken(token);
})

function getAuthHeaders(){
    if(!token) throw new Error("User not authenticated. ");
    return{
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    }
}

async function isFacilityBookmarked(placeID){
    try{
        const response = await fetch(`${apiBaseURL}/bookmark/${placeID}`, {
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
        return Array.isArray(data) && data.length > 0;
    }catch(error){
        if(!error.message.includes("404")){
            console.error("Error checking if facility is bookmarked: ", error);
        }
        return false;
    }
}

async function createBookmarkIfNotExists(placeID){
    try{
        const response = await fetch(`${apiBaseURL}/bookmark`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({placeID})
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

async function createCategoryIfNotExists(categoryName){
    try{
        const response = await fetch(`${apiBaseURL}/category`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({categoryName})
        });

        const data = await response.json();

        if (response.status === 201) {
            return data[0];
        } else if (response.status === 409) {
            // Already exists, so fetch it
            const categories = await fetchCategories();
            const match = categories.find(c => c.categoryName.toLowerCase() === categoryName.toLowerCase());
            return match?.categoryID ?? null;
        } else {
            throw new Error("Unexpected response creating category");
        }
    }catch(error){
        console.error("Failed to create category: ", error);
        alert("Failed to create category");
        return null;
    }
}

async function fetchCategories(){
    try{
        const response = await fetch(`${apiBaseURL}/categories`, {
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

async function assignBookmarkToCategory(bookmarkID, categoryID){
    try{
        console.log("BookmarkID", bookmarkID);
        console.log("CategoryID", categoryID);
        const response = await fetch(`${apiBaseURL}/bookmark-category`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({bookmarkID, categoryID})
        })

        const responseBody = response.headers
          .get("content-type")
          ?.includes("application/json")
          ? await response.json()
          : {message: response.statusText};

        if (response.status === 201){
            console.log("successfully assigned")
        } else if (response.status === 409){
            console.log("Bookmark already assigned to this category!")
        } else{
            throw new Error(`API error! status: ${response.status}, message: ${responseBody.message}`);
        }

        if(response.ok){
            return true;
        }

    }catch(error){
        console.error("Error assigning bookmark to category");
        return false;
    }
}

window.handleBookmarkClick = async function (placeID, placeName){
    const bookmark = await createBookmarkIfNotExists(placeID);
    const bookmarkID = bookmark.bookmarkID;
    console.log("BookmarkID", bookmarkID);
    if(!bookmarkID) return;

    // Ask for existing category selection or new category
    const categories = await fetchCategories();
    console.log("CategoryID", categories);
    console.log("About to show modal...");
    showCategoryModal(categories, async(selectedIDs, newCategoryName) => {
        const categoryIDs = [...selectedIDs];

        if(newCategoryName){
            const newID = await createCategoryIfNotExists(newCategoryName);
            if(newID) categoryIDs.push(newID);
        }

        // Assign bookmark to all selected categories
        let allSuccess = true;
        for (const categoryID of categoryIDs){
            const success = await assignBookmarkToCategory(bookmarkID, categoryID);
            if(!success){
                allSuccess = false;
            }
        }

        if(allSuccess){
            alert(`Bookmarked "${placeName}" into ${categoryIDs.length} categories.`);
            updateBookmarkIcon(placeID, true);
        } else{
            alert("Some categories failed to assign.");
        }
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
    console.log("Modal found and displaying...");
    const modal = document.getElementById("categoryModal");
    const form = document.getElementById("categoryForm");
    const checkboxesDiv = document.getElementById("categoryCheckboxes");
    const newCategoryInput = document.getElementById("newCategory");
    const cancelBtn = document.getElementById("cancelModal");

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

    // Before inserting the button, remove any existing one
    const existingAddBtn = newCategoryInput.parentNode.querySelector(".add-category-btn");
    if(existingAddBtn){
        existingAddBtn.remove();
    }

    // Handle Add New Category 
    const addBtn = document.createElement("button");
    addBtn.textContent = "Add";
    addBtn.type = "button";
    addBtn.style.marignLeft = "0.5rem";
    newCategoryInput.parentNode.insertBefore(addBtn, newCategoryInput.nextSibling);

    addBtn.onclick = handleNewCategory;

    async function handleNewCategory(){
        const newCategory = newCategoryInput.value.trim();
        if(!newCategory) return;

        const newID = await createCategoryIfNotExists(newCategory);
        if(newID){
            categories.push({categoryID: newID, categoryName: newCategory});
            renderCheckboxes(categories); // Refresh with new checkbox
            newCategoryInput.value = "";
        }else{
            alert("Failed to create category.");
        }
    }

    // Submit selected categories
    form.onsubmit = (e) => {
        e.preventDefault();
        const selectedIDs = Array.from(checkboxesDiv.querySelectorAll("input:checked"))
                            .map(input => parseInt(input.value));
        const newCategory = newCategoryInput.value.trim();
        modal.style.display = "none";
        form.reset();
        onSubmit(selectedIDs, newCategory);
    };

    cancelBtn.onclick = () => {
        modal.style.display = "none";
        form.reset();
    }

    modal.style.display = "flex";
}