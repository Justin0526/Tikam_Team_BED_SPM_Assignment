const apiBaseUrl = "http://localhost:3000";
let currentUser = null;

// Get references to important DOM elements for image, content, and post display
const imageInput = document.getElementById("postImage");
const preview = document.getElementById("imagePreview");
const removeBtn = document.getElementById("removeImageBtn");
const shareBtn = document.querySelector(".share-btn");
const contentEl = document.getElementById("postContent");
const postContainer = document.querySelector(".posts-list");

// Filter UI elements
const filterDateInput = document.getElementById("filterDate");
const filterOwnerInput = document.getElementById("filterOwner");
const applyFilterBtn = document.getElementById("applyFilterBtn");
const resetFilterBtn = document.getElementById("resetFilterBtn");

// Format a given ISO date string into a readable date/time format
function toLocaleDate(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

//refreshes like everytime a post is liked to keep data up to date
async function updateLikeStatus(postID, likeBtn, likeCountEl) {
  try {
    const res = await fetch(`${apiBaseUrl}/posts/${postID}/likes`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    if (likeCountEl) likeCountEl.textContent = data.LikeCount;
    if (likeBtn) likeBtn.classList.toggle("liked", data.Liked === 1);

    console.log(`Post ${postID} → Likes:`, data); // 
  } catch (err) {
    console.warn("Failed to fetch like status:", err);
  }
}

// Load and display all comments for a specific post
async function loadComments(postID, listEl) {
  try {
    const res = await fetch(`${apiBaseUrl}/posts/${postID}/comments`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Comments ${res.status}`);
    const comments = await res.json();
    if (!Array.isArray(comments)) throw new Error("Bad comments payload");

    listEl.innerHTML = ""; // Clear current comments

    comments.forEach(comment => {
      const commentItem = document.createElement("div");
      commentItem.classList.add("comment-item");
      
      // Makes sure the userID of the post or comment matches the currentUserID to allow it to assign ownership
      const isOwner = currentUser && currentUser.userID === comment.UserID;

      // Create the comment HTML structure
      commentItem.innerHTML = `
        <div class="meta">
          <strong class="author">${comment.userName}</strong>
          <span class="date">${toLocaleDate(comment.createdAt)}</span>
        </div>
        <div class="body">${comment.Content}</div>
        ${isOwner ? `
        <div class="comment-owner-actions">
          <button class="edit-comment-btn">✏️</button>
          <button class="delete-comment-btn">🗑️</button>
        </div>
        <div class="edit-comment-form" hidden>
          <textarea class="edit-comment-content">${comment.Content}</textarea>
          <button class="save-comment-edit">Save</button>
          <button class="cancel-comment-edit">Cancel</button>
        </div>` : ""}
      `;
      listEl.appendChild(commentItem);

      // Add functionality to edit and delete comments if user is the owner
      if (isOwner) {
        const editBtn = commentItem.querySelector(".edit-comment-btn");
        const editForm = commentItem.querySelector(".edit-comment-form");
        const contentInput = commentItem.querySelector(".edit-comment-content");
        const saveBtn = commentItem.querySelector(".save-comment-edit");
        const cancelBtn = commentItem.querySelector(".cancel-comment-edit");
        const deleteBtn = commentItem.querySelector(".delete-comment-btn");

        editBtn.addEventListener("click", () => {
          editForm.hidden = false;
          editBtn.hidden = true;
        });

        cancelBtn.addEventListener("click", () => {
          editForm.hidden = true;
          editBtn.hidden = false;
        });

        deleteBtn.addEventListener("click", async () => {
          if (!confirm("Delete this comment?")) return;

          const res = await fetch(`${apiBaseUrl}/posts/${postID}/comments/${comment.CommentID}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });

          if (!res.ok) {
            alert("Failed to delete comment.");
            return;
          }

          await loadComments(postID, listEl); // Reload updated comments
        });

        saveBtn.addEventListener("click", async () => {
          const updated = contentInput.value.trim();
          if (!updated) return alert("Comment cannot be empty.");

          const res = await fetch(`${apiBaseUrl}/posts/${postID}/comments/${comment.CommentID}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ content: updated })
          });

          if (!res.ok) return alert("Failed to update comment.");
          loadComments(postID, listEl);
        });
      }
    });
  } catch (err) {
    console.error("Error loading comments:", err);
    listEl.innerHTML = `<p class="error">Unable to load comments</p>`;
  }
  const lang = localStorage.getItem("language") || "en";
  if (lang !== "en" && typeof translateElements === "function") {
    setTimeout(() => {
      translateElements(".comment-item .body", lang);
    }, 100);
  }

}

// Load and render all posts from the database (with optional filters)
async function loadPosts(filters = {}) {
  try {
    const res = await fetch(`${apiBaseUrl}/posts`);
    if (!res.ok) throw new Error(`Posts ${res.status}`);
    let posts = await res.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      postContainer.innerHTML = `<p>No posts yet.</p>`;
      return;
    }

    // Apply filters
    if (filters.date) {
      const selectedDate = new Date(filters.date).toDateString();
      posts = posts.filter(p => new Date(p.CreatedAt).toDateString() === selectedDate);
    }

    // Filter by author name (case-insensitive)
    if (filters.owner) {
      const nameQuery = filters.owner.toLowerCase().trim();
      posts = posts.filter(p => p.Author.toLowerCase().includes(nameQuery));
    }
    if (posts.length === 0) {
      postContainer.innerHTML = `<p>No posts match your filters.</p>`;
      return;
    }

    // Generate and display posts
    postContainer.innerHTML = posts.map(p => {
      const date = toLocaleDate(p.CreatedAt);
      const isOwner = currentUser && currentUser.userID === p.UserID;

      return `
      <div class="post-item" data-post-id="${p.PostID}">
        <div class="post-header">
          <div class="avatar"></div>
          <div class="meta">
            <strong class="author">${p.Author}</strong>
            <span class="date">${date}</span>
          </div>
        </div>
        <div class="post-body">${p.Content}</div>
        ${p.ImageURL ? `<div class="post-image-wrap"><img src="${p.ImageURL}" class="post-image" alt=""></div>` : ""}
        <div class="post-actions">
          <button class="comment-toggle">💬 View Comment</button>
          <button class="like-btn">❤️</button>
          <span class="like-count">0</span>
          ${isOwner ? `
            <div class="post-menu-wrapper">
              <button class="post-menu-btn" aria-label="Post options">⋯</button>
              <div class="post-menu-dropdown" hidden>
                <button class="post-menu-edit">✏️ Edit</button>
                <button class="post-menu-delete">🗑️ Delete</button>
              </div>
            </div>` : ""}
        </div>
        ${isOwner ? `
          <div class="edit-post-form" hidden>
            <textarea class="edit-content" data-original="${p.Content}">${p.Content}</textarea>
            ${p.ImageURL ? `<img src="${p.ImageURL}" class="edit-image-preview">` : ""}
            <input type="file" class="edit-image-input" hidden>
            <button class="change-image-btn">Change Picture</button>
            <div class="edit-btn-row">
              <button class="cancel-edit-btn">Cancel</button>
              <button class="save-edit-btn">Save Changes</button>
            </div>
          </div>` : ""}
        <div class="comments-section" hidden>
          <div class="comment-list"></div>
          <textarea class="new-comment" placeholder="Write a comment..."></textarea>
          <button class="submit-comment">Post Comment</button>
        </div>
      </div>`;
    }).join("");

    attachPostEventListeners();
    translateElementScope(postContainer);
  } catch (err) {
    console.error("Error loading posts:", err);
    postContainer.innerHTML = `<p class="error">Failed to load posts.</p>`;
  }
}

// Attach events (likes, comments, dropdown, edit/delete posts)
function attachPostEventListeners() {
  postContainer.querySelectorAll(".post-item").forEach(item => {
    const postID = item.dataset.postId;

    // ─── Lightbox ────────────────────────────────
    const lightbox = document.getElementById("imageLightbox");
    const lightboxImage = lightbox.querySelector(".lightbox-image");
    const closeBtn = lightbox.querySelector(".close-btn");

    item.querySelectorAll(".post-image").forEach(img => {
      img.addEventListener("click", () => {
        lightboxImage.src = img.src;
        lightbox.hidden = false;
      });
    });

    closeBtn.addEventListener("click", () => (lightbox.hidden = true));
    lightbox.addEventListener("click", e => {
      if (e.target === lightbox) lightbox.hidden = true;
    });

    // ─── Comments Toggle & Submission ────────────────────────────────
    const toggle = item.querySelector(".comment-toggle");
    const section = item.querySelector(".comments-section");
    const listEl = item.querySelector(".comment-list");
    const commentInput = item.querySelector(".new-comment");
    const submitCommentBtn = item.querySelector(".submit-comment");

    // Toggle comments section
    toggle.addEventListener("click", () => {
      if (section.hidden) loadComments(postID, listEl);
      section.hidden = !section.hidden;
    });

    // Submit new comment
    submitCommentBtn.addEventListener("click", async () => {
      const content = commentInput.value.trim();
      if (!content) return alert("Comment cannot be empty.");

      try {
        const res = await fetch(`${apiBaseUrl}/posts/${postID}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ content })
        });

        if (!res.ok) throw new Error("Failed to post comment");

        // Clear input and reload comments
        commentInput.value = "";
        await loadComments(postID, listEl);
      } catch (err) {
        console.error("Error posting comment:", err);
        alert("Failed to post comment. Please try again.");
      }
    });

    // ─── Likes ────────────────────────────────
    const likeBtn = item.querySelector(".like-btn");
    const likeCountEl = item.querySelector(".like-count");

    // Load current like status
    updateLikeStatus(postID, likeBtn, likeCountEl);

    likeBtn.addEventListener("click", async () => {
      try {
        const isLiked = likeBtn.classList.contains("liked");

        if (isLiked) {
          // Unlike
          const res = await fetch(`${apiBaseUrl}/posts/${postID}/unlike`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Failed to unlike");
        } else {
          // Like
          const res = await fetch(`${apiBaseUrl}/posts/${postID}/like`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Failed to like");
        }

        await updateLikeStatus(postID, likeBtn, likeCountEl);
      } catch (err) {
        console.error("Error toggling like:", err);
      }
    });

    // ─── Dropdown Menu ────────────────────────────────
    const menuBtn = item.querySelector(".post-menu-btn");
    const dropdown = item.querySelector(".post-menu-dropdown");
    const editBtn = item.querySelector(".post-menu-edit");
    const delBtn = item.querySelector(".post-menu-delete");
    const editForm = item.querySelector(".edit-post-form");
    const editContent = item.querySelector(".edit-content");
    const changeBtn = item.querySelector(".change-image-btn");
    const editInput = item.querySelector(".edit-image-input");
    const saveBtn = item.querySelector(".save-edit-btn");
    const cancelBtn = item.querySelector(".cancel-edit-btn");
    const editPreview = item.querySelector(".edit-image-preview");

    if (menuBtn && dropdown) {
      menuBtn.addEventListener("click", e => {
        e.stopPropagation();
        document.querySelectorAll(".post-menu-dropdown").forEach(d => d.hidden = true);
        dropdown.hidden = !dropdown.hidden;
        if (!dropdown.hidden) translateElementScope(dropdown);
      });

      document.addEventListener("click", e => {
        if (!item.contains(e.target)) dropdown.hidden = true;
      });
    }

    // ─── Edit Post ────────────────────────────────
    if (editBtn && editForm) {
      editBtn.addEventListener("click", () => {
        dropdown.hidden = true;
        document.querySelectorAll(".edit-post-form").forEach(f => f.hidden = true);
        editForm.hidden = false;
        editContent.value = editContent.dataset.original;
        translateElementScope(editForm);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        editForm.hidden = true;
      });
    }

    // Change image in edit mode
    if (changeBtn && editInput) {
      changeBtn.addEventListener("click", () => editInput.click());
      editInput.addEventListener("change", async () => {
        const file = editInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = evt => {
          let previewImg = editPreview;
          if (!previewImg) {
            previewImg = document.createElement("img");
            previewImg.className = "edit-image-preview";
            previewImg.style.display = "block";
            editInput.parentNode.insertBefore(previewImg, editInput.nextSibling);
          }
          previewImg.src = evt.target.result;
        };
        reader.readAsDataURL(file);

        const form = new FormData();
        form.append("file", file);
        try {
          const res = await fetch(`${apiBaseUrl}/api/upload`, { method: "POST", body: form });
          if (!res.ok) throw new Error("Upload failed");
          const data = await res.json();
          editForm.dataset.newImageUrl = data.url;
          if (editPreview) editPreview.src = data.url;
        } catch (err) {
          alert("Image upload failed.");
        }
      });
    }

    // Save post edits
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const updatedContent = editContent.value.trim();
        if (!updatedContent) return alert("Post content cannot be empty.");

        const previewImg = editForm.querySelector(".edit-image-preview");
        const originalImageUrl = previewImg ? previewImg.src : null;
        const newImageUrl = editForm.dataset.newImageUrl || null;

        const finalImage = newImageUrl ?? originalImageUrl;
        if (finalImage && finalImage.startsWith("data:")) {
          return alert("Please wait for the image to finish uploading before saving.");
        }

        const res = await fetch(`${apiBaseUrl}/posts/${postID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ Content: updatedContent, ImageURL: finalImage })
        });

        if (!res.ok) return alert("Failed to update post.");
        await loadPosts();
      });
    }

    // Delete post
    if (delBtn) {
      delBtn.addEventListener("click", async () => {
        if (!confirm("Delete this post?")) return;
        const res = await fetch(`${apiBaseUrl}/posts/${postID}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return alert(err.error || "Couldn’t delete post");
        }
        item.remove();
      });
    }
  });
}


// On window load
window.addEventListener("load", async () => {
  currentUser = await getToken(token);
  await loadPosts(); // This calls attachPostEventListeners() internally
});


// Handle filters
applyFilterBtn.addEventListener("click", () => {
  const date = filterDateInput.value || null;
  const owner = filterOwnerInput.value.trim() || ""; 
  loadPosts({ date, owner });
});

resetFilterBtn.addEventListener("click", () => {
  filterDateInput.value = "";
  filterOwnerInput.value = ""; 
  loadPosts();
});

// Image preview before upload
imageInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) {
    preview.style.display = removeBtn.style.display = "none";
    return;
  }
  const reader = new FileReader();
  reader.onload = evt => {
    preview.src = evt.target.result;
    preview.style.display = "block";
    removeBtn.style.display = "inline-block";
  };
  reader.readAsDataURL(file);
});

// Remove selected image before sharing
removeBtn.addEventListener("click", () => {
  imageInput.value = "";
  preview.style.display = removeBtn.style.display = "none";
});

// Share new post
shareBtn.addEventListener("click", async () => {
  shareBtn.disabled = true;
  const content = contentEl.value.trim();
  if (!content) {
    alert("Please write something before sharing.");
    shareBtn.disabled = false;
    return;
  }
  if (!currentUser) {
    alert("Please log in to share a post.");
    shareBtn.disabled = false;
    return window.location.href = "/html/login.html";
  }

  let imageURL = null;
  const file = imageInput.files[0];
  if (file) {
    const form = new FormData();
    form.append("file", file);
    try {
      const uplRes = await fetch(`${apiBaseUrl}/api/upload`, { method: "POST", body: form });
      if (!uplRes.ok) throw new Error("Upload failed");
      const { url } = await uplRes.json();
      imageURL = url;
    } catch (err) {
      console.error("Upload error:", err);
      alert("Image upload failed.");
      shareBtn.disabled = false;
      return;
    }
  }

  const res = await fetch(`${apiBaseUrl}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ UserID: currentUser.userID, Content: content, ImageURL: imageURL })
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.error || "Failed to share post");
    shareBtn.disabled = false;
    return;
  }

  contentEl.value = "";
  imageInput.value = "";
  preview.style.display = removeBtn.style.display = "none";
  await loadPosts();
  shareBtn.disabled = false;
});

// Handle new post image preview before upload
imageInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) {
    preview.style.display = removeBtn.style.display = "none";
    return;
  }
  const reader = new FileReader();
  reader.onload = evt => {
    preview.src = evt.target.result;
    preview.style.display = "block";
    removeBtn.style.display = "inline-block";
  };
  reader.readAsDataURL(file);
});

// Remove selected image before sharing
removeBtn.addEventListener("click", () => {
  imageInput.value = "";
  preview.style.display = removeBtn.style.display = "none";
});

// Share post handler
shareBtn.addEventListener("click", async () => {
  shareBtn.disabled = true;
 //Ensures user does not post empty posts
  const content = contentEl.value.trim();
  if (!content) {
    alert("Please write something before sharing.");
    shareBtn.disabled = false;
    return;
  }
//Ensures user is logged in 
  if (!currentUser) {
    alert("Please log in to share a post.");
    shareBtn.disabled = false;
    return window.location.href = "/html/login.html";
  }

// Initialise imageURL as null; will store the final URL if an image is uploaded
  let imageURL = null;
  // Get the first file the user selected from the input element
  const file = imageInput.files[0];
  if (file) {
    const form = new FormData();
    // Append the file to the form data with the field name "file"
    form.append("file", file);
    try {
      // Send the file to Cloudinary API to post to database via POST request
      const uplRes = await fetch(`${apiBaseUrl}/api/upload`, {
        method: "POST",
        body: form
      });
      if (!uplRes.ok) throw new Error("Upload failed");
      const { url } = await uplRes.json();
      // Store the uploaded image's URL in the imageURL variable
      imageURL = url;
    } catch (err) {
      console.error("Upload error:", err);
      alert("Image upload failed.");
      shareBtn.disabled = false;
      return;
    }
  }

  const res = await fetch(`${apiBaseUrl}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      UserID: currentUser.userID,
      Content: content,
      ImageURL: imageURL
    })
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.error || "Failed to share post");
    shareBtn.disabled = false;
    return;
  }
  
  //Makes sure that the post form after posting a post is empty and refreshes the posts to display new ones
  contentEl.value = "";
  imageInput.value = "";
  preview.style.display = removeBtn.style.display = "none";
  await loadPosts();
  shareBtn.disabled = false;
});


// On window load, get token and fetch posts
window.addEventListener("load", async () => {
  currentUser = await getToken(token);
  await loadPosts(); // wait for posts to load first
});