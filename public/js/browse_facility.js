const apiBaseUrl = "http://localhost:3000";
let currentQuery = "";
let nextPageToken = null;

const goBtn = document.getElementById("go-btn");
const backBtn = document.getElementById("back-to-search");
const textQuery = document.getElementById("textQuery");
const quickSearchContainer = document.getElementById("quicksearch-container");
const resultsSection = document.getElementById("results-section");
const resultsTitle = document.getElementById("results-title");
const resultsGrid = document.getElementById("results-grid");
const loadMoreWrapper = document.getElementById("load-more-wrapper");

// event listener for go button
goBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    currentQuery = textQuery.value;
    nextPageToken = null;

    if (!currentQuery) return alert("Please enter a search term.");

    resultsTitle.textContent = "";
    resultsGrid.innerHTML = "";
    loadMoreWrapper.innerHTML = "";
    quickSearchContainer.style.display = "block";
    resultsSection.style.display = "none";

    await fetchFacilities(currentQuery);
});

// search facilities via quicksearch card
document.querySelectorAll('.quicksearch-card').forEach(card => {
    card.addEventListener('click', async () => {
        const query = card.querySelector('.quicksearch-label')?.textContent?.trim();
        if (!query) return;

        textQuery.value = query; // also update the search bar
        currentQuery = query;
        nextPageToken = null;

        resultsTitle.textContent = "";
        resultsGrid.innerHTML = "";
        loadMoreWrapper.innerHTML = "";
        quickSearchContainer.style.display = "block";
        resultsSection.style.display = "none";

        await fetchFacilities(currentQuery);
    });
});

// fetch facilities through user's query
async function fetchFacilities(query, pageToken = null) {
    try {
        const reqBody = {
            textQuery: query.toLowerCase().trim(),
            includedType: null
        };

        if (pageToken) {
            reqBody.pageToken = pageToken;
        }

        const response = await fetch(`${apiBaseUrl}/facilities`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(reqBody)
        });

        if (!response.ok) {
            const errorBody = response.headers
                .get("content-type")
                ?.includes("application/json")
                ? await response.json()
                : { message: response.statusText };
            throw new Error(`HTTP Error! status ${response.status}, message: ${errorBody.message}`);
        }

        const data = await response.json();
        const results = data.places
        nextPageToken = data.nextPageToken

        if (!pageToken) {
            resultsGrid.innerHTML = "";
            loadMoreWrapper.innerHTML = "";
            resultsTitle.textContent = `Results for: ${query}`;
            if (!Array.isArray(results) || results.length === 0) {
                resultsTitle.textContent = `No results for: ${query}`;
            }
        }

        quickSearchContainer.style.display = "none";
        resultsSection.style.display = "block";

        renderFacilities(results);

        if (nextPageToken) {
            renderLoadMoreButton();
        } else{
            loadMoreWrapper.innerHTML = "";
        }

    } catch (error) {
        console.error("Error fetching facility", error);
        alert("Failed to load facility info");
    }
}

// Get the photo of the facility
async function fetchPhoto(placePhoto) {
    try {
        const maxHeightPx = 400;
        const maxWidthPx = 300;
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

// Display all facilites returned from the search results
async function renderFacilities(results) {
    const resultGrid = document.getElementById("results-grid");

    results.forEach(async (result) => {
        const resultCard = document.createElement("div");
        resultCard.classList.add("result-card");

        const openNow = result.currentOpeningHours?.openNow === true ? "Open" : "Closed";
        const accessibility = (result.accessibilityOptions?.wheelchairAccessibleParking === true &&
        result.accessibilityOptions?.wheelchairAccessibleEntrance === true)
        ? "Wheelchair-friendly" : "Not wheelchair-accessible";
        console.log(result);

        let photoHTML = `<div class="picture-placeholder">No Picture Available</div>`;
        if (result.photos && result.photos.length > 0) {
            try {
                const imageURL = await fetchPhoto(result.photos[0]);
                photoHTML = `<img class="picture-placeholder" src="${imageURL}">`;
            } catch (e) {
                console.warn("Photo fetch failed, showing placeholder.");
            }
        }
        resultCard.innerHTML = `
            <div class="result-card-content">
                ${photoHTML}
                <img width="50" height="50" src="../images/unfilled-bookmark-icon.png" class="bookmark-icon" data-place-id="${result.id}"/>
                <div class="facility-details">
                <p class="facility-name">${result.displayName.text}</p>
                <p><strong>Address:</strong> ${result.formattedAddress}</p>
                <p><strong>Currently Open:</strong> ${openNow}</p>
                <p><strong>Accessibility:</strong> ${accessibility}</p>
                </div>
            </div>
            <a href="${result.googleMapsLinks.directionsUri}" class="take-me-btn" target="_blank" rel="noopener noreferrer">Take me there &gt;</a>
        `;

        const bookmarkImg = resultCard.querySelector(".bookmark-icon");

        // Check if already bookmarked
        isFacilityBookmarked(result.id).then(bookmarked => {
            bookmarkImg.src = bookmarked ? window.filledIcon : window.unfilledIcon;
            bookmarkImg.setAttribute("data-bookmarked", bookmarked);

            bookmarkImg.addEventListener("mouseenter", () => {
                if (bookmarkImg.getAttribute("data-bookmarked") === "false") {
                    bookmarkImg.src = window.filledIcon;
                }
            });

            bookmarkImg.addEventListener("mouseleave", () => {
                if (bookmarkImg.getAttribute("data-bookmarked") === "false") {
                    bookmarkImg.src = window.unfilledIcon;
                }
            });
        });

        bookmarkImg.addEventListener("click", async () => {
            await window.handleBookmarkClick(result.id, result.displayName.text);
        });

        resultGrid.appendChild(resultCard);
    });
}

// Display load more button if there are more results
async function renderLoadMoreButton() {
    const wrapper = document.getElementById("load-more-wrapper");
    wrapper.innerHTML = ""; // clear old button

    const loadMoreBtn = document.createElement("button");
    loadMoreBtn.id = "load-more-btn";
    loadMoreBtn.textContent = "Load More";

    loadMoreBtn.addEventListener("click", async () => {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = "Loading...";
        await fetchFacilities(currentQuery, nextPageToken);
    });

    wrapper.appendChild(loadMoreBtn);
}

