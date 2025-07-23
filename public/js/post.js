// ─── Config & State ─────────────────────────────────────────────────────────
const apiBaseUrl = "http://localhost:3000";
let currentUser   = null;

// ─── DOM Nodes ────────────────────────────────────────────────────────────────
const imageInput = document.getElementById("postImage");
const preview = document.getElementById("imagePreview");
const removeBtn = document.getElementById("removeImageBtn");
const shareBtn = document.querySelector(".share-btn");
const contentEl = document.getElementById("postContent");
const postContainer = document.querySelector(".posts-list");

//formatting function for posts
function toLocaleDate(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

//Load & Render Public Posts 
async function loadComments(postID, listEl) {
  try {
    const res = await fetch(`${apiBaseUrl}/posts/${postID}/comments`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Comments ${res.status}`);
    const comments = await res.json();
    if (!Array.isArray(comments)) throw new Error("Bad comments payload");

    listEl.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="meta">
          <strong class="author">${c.userName}</strong>
          <span class="date">${toLocaleDate(c.createdAt)}</span>
        </div>
        <div class="body">${c.Content}</div>
      </div>
    `).join("");
  } catch (err) {
    console.warn(`Failed to load comments for post ${postID}:`, err);
    listEl.innerHTML = `<p class="error">Unable to load comments</p>`;
  }
}

// ─── Fetch & Render All Posts ────────────────────────────────────────────────
async function loadPosts() {
  try {
    const res = await fetch(`${apiBaseUrl}/posts`);
    if (!res.ok) throw new Error(`Posts ${res.status}`);
    const posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      postContainer.innerHTML = `<p>No posts yet.</p>`;
      return;
    }

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
            <button class="comment-toggle">💬 Comment</button>
            ${isOwner ? `<button class="post-menu-btn" aria-label="Post options">⋯</button>` : ""}
          </div>
          ${isOwner ? `
            <div class="post-menu-dropdown" hidden>
              <button class="post-menu-edit">✏️ Edit</button>
              <button class="post-menu-delete">🗑️ Delete</button>
            </div>
            <div class="edit-post-form" hidden>
              <textarea class="edit-content">${p.Content}</textarea>
              ${p.ImageURL ? `<img src="${p.ImageURL}" class="edit-image-preview">` : ""}
              <input type="file" class="edit-image-input" hidden>
              <button class="change-image-btn">Change Picture</button>
              <div class="edit-btn-row">
                <button class="cancel-edit-btn">Cancel</button>
                <button class="save-edit-btn">Save Changes</button>
              </div>
            </div>
          ` : ""}
          <div class="comments-section" hidden>
            <div class="comment-list"></div>
            <textarea class="new-comment" placeholder="Write a comment..."></textarea>
            <button class="submit-comment">Post Comment</button>
          </div>
        </div>
      `;
    }).join("");

    postContainer.querySelectorAll(".post-item").forEach(item => {
      const postID = item.dataset.postId;
      const menuBtn = item.querySelector(".post-menu-btn");
      const dropdown = item.querySelector(".post-menu-dropdown");
      const delBtn = item.querySelector(".post-menu-delete");
      const editBtn = item.querySelector(".post-menu-edit");

      const editForm = item.querySelector(".edit-post-form");
      const editContent = item.querySelector(".edit-content");
      const editPreview = item.querySelector(".edit-image-preview");
      const editInput = item.querySelector(".edit-image-input");
      const changeBtn = item.querySelector(".change-image-btn");
      const cancelBtn = item.querySelector(".cancel-edit-btn");
      const saveBtn = item.querySelector(".save-edit-btn");

      let newImageURL = editPreview?.src || null;

      if (menuBtn && dropdown && delBtn && editBtn && editForm) {
        menuBtn.addEventListener("click", e => {
          e.stopPropagation();
          document.querySelectorAll(".post-menu-dropdown").forEach(d => d.hidden = true);
          dropdown.hidden = !dropdown.hidden;
        });

        document.addEventListener("click", e => {
          if (!item.contains(e.target)) {
            dropdown.hidden = true;
          }
        });

        delBtn.addEventListener("click", async () => {
          if (!confirm("Delete this post?")) return;
          const res = await fetch(`${apiBaseUrl}/posts/${postID}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return alert(err.error || "Couldn’t delete");
          }
          item.remove();
        });

        editBtn.addEventListener("click", () => {
          editForm.hidden = !editForm.hidden;
        });

        changeBtn.addEventListener("click", () => editInput.click());

        editInput.addEventListener("change", async () => {
          const file = editInput.files[0];
          if (!file) return;

          const form = new FormData();
          form.append("file", file);

          try {
            const res = await fetch(`${apiBaseUrl}/api/upload`, {
              method: "POST",
              body: form
            });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            newImageURL = data.url;
            if (editPreview) {
              editPreview.src = newImageURL;
              editPreview.style.display = "block";
            }
          } catch (err) {
            alert("Image upload failed.");
          }
        });

        cancelBtn.addEventListener("click", () => {
          editForm.hidden = true;
        });

        saveBtn.addEventListener("click", async () => {
          const updatedContent = editContent.value.trim();
          if (!updatedContent) return alert("Post content cannot be empty.");

          const res = await fetch(`${apiBaseUrl}/posts/${postID}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              Content: updatedContent,
              ImageURL: newImageURL
            })
          });

          if (!res.ok) return alert("Failed to update post.");
          loadPosts(); // reload updated content
        });
      }

      // Comments
      const toggle = item.querySelector(".comment-toggle");
      const section = item.querySelector(".comments-section");
      const listEl = item.querySelector(".comment-list");
      const input = item.querySelector(".new-comment");
      const submitBtn = item.querySelector(".submit-comment");

      toggle.addEventListener("click", () => {
        if (section.hidden) loadComments(postID, listEl);
        section.hidden = !section.hidden;
      });

      submitBtn.addEventListener("click", async () => {
        const text = input.value.trim();
        if (!text) return alert("Please write a comment.");
        if (!currentUser) {
          alert("You must log in to comment.");
          return window.location.href = "/html/login.html";
        }

        const resp = await fetch(`${apiBaseUrl}/posts/${postID}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            UserID: currentUser.userID,
            content: text
          })
        });

        if (!resp.ok) return alert("Failed to post comment");
        const newComment = await resp.json();

        listEl.insertAdjacentHTML("beforeend", `
          <div class="comment-item">
            <div class="meta">
              <strong class="author">${currentUser.username}</strong>
              <span class="date">just now</span>
            </div>
            <div class="body">${newComment.Content}</div>
          </div>
        `);

        input.value = "";
      });
    });
  } catch (err) {
    console.error("Error loading posts:", err);
    postContainer.innerHTML = `<p class="error">Failed to load posts.</p>`;
  }
}

// ─── Image Preview Logic ──────────────────────────────────────────────────────
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
removeBtn.addEventListener("click", () => {
  imageInput.value = "";
  preview.style.display = removeBtn.style.display = "none";
});


// ─── Share Post Handler (login required) ─────────────────────────────────────
shareBtn.addEventListener("click", async () => {
  const content = contentEl.value.trim();
  if (!content) {
    return alert("Please write something before sharing.");
  }
  if (!currentUser) {
    alert("Please log in to share a post.");
    return window.location.href = "/html/login.html";
  }

  // 1) Upload the file to your new /api/upload endpoint (if any)
  let imageURL = null;
  const file = imageInput.files[0];
  if (file) {
    const form = new FormData();
    form.append("file", file);
    try {
      const uplRes = await fetch(`${apiBaseUrl}/api/upload`, {
        method: "POST",
        body:   form
      });
      if (!uplRes.ok) throw new Error("Upload failed");
      const { url } = await uplRes.json();
      imageURL = url;
    } catch (err) {
      console.error("Upload error:", err);
      return alert("Image upload failed.");
    }
  }

  // 2) Create the post, sending your JWT & userID
  const userID = currentUser.userID || currentUser.sub;
  const res = await fetch(`${apiBaseUrl}/posts`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
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
    return alert(err.error || "Failed to share post");
  }

  // 3) On success clear & reload
  contentEl.value = "";
  imageInput.value = "";
  preview.style.display = removeBtn.style.display = "none";
  loadPosts();
});

// ─── Init & Auth ──────────────────────────────────────────────────────────────
// 1) First load public posts
window.addEventListener("load", async () => {
  currentUser = await getToken(token);
  loadPosts(); // ✅ ensures currentUser is available before rendering
});
