window.addEventListener("load", async() => {
    await renderCategories();
    const allBookmarks = await getAllBookmarks();
    const bookmarkDetails = await getBookmarkDetails(allBookmarks);
    console.log(bookmarkDetails);
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

async function renderCategories(){
    const categoryGrid = document.getElementById("category-grid");

    const categories = await fetchCategories();
    categories.forEach(category => {
        const categoryBtn = document.createElement("button");
        categoryBtn.classList.add("category-btn");
        categoryBtn.textContent = category.categoryName;
        categoryGrid.appendChild(categoryBtn);
    })
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

    for (const bookmark of bookmarks){
        const placeID = bookmark.placeID;
        const bookmarkID = bookmark.bookmarkID;

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
            const categoriesData = await getCategoriesOfBookmark(bookmarkID);
            let categories = [];
            if(categoriesData.length > 0){
                for (const category of categoriesData){
                    categories.push(category.categoryName)
                }
            }else{
                categories = "No category"
            }
            const detailed = convertToDetailedBookmark(bookmark, googleData, categories);
            detailedBookmarks.push(detailed);
        } catch(error){
            console.error(`Error fetching details for placeID ${placeID}: `, error)
        }
    }
    return detailedBookmarks;
    
}

// Function to get all category of the bookmark
async function getCategoriesOfBookmark(bookmarkID){
    try{
        const response = await fetch(`${apiBaseUrl}/bookmark-category/bookmark/${bookmarkID}`, {
            method: "GET",
            headers: getAuthHeaders(),
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

        const categories = await response.json();
        return categories;
    }catch(error){
        console.error(`Error getting categories for ${bookmarkID}`);
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
function convertToDetailedBookmark(bookmark, placeData, categories) {
    return {
        bookmarkID: bookmark.bookmarkID,
        category: categories,
        bookmarkedDate: formatDate(bookmark.bookmarkedAt),
        name: placeData.displayName?.text || "Unknown",
        address: placeData.formattedAddress || "No address available",
        openNow: placeData.currentOpeningHours?.openNow ? "Open" : "Closed",
        accessibility: interpretAccessibility(placeData.accessibilityOptions),
        mapsLink: placeData.googleMapsLinks?.placeUri || "#"
    };
}
// async function renderBookmarks(){
    
// }
