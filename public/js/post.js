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
    const res   = await fetch(`${apiBaseUrl}/posts`);
    if (!res.ok) throw new Error(`Posts ${res.status}`);
    const posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      postContainer.innerHTML = `<p>No posts yet.</p>`;
      return;
    }

    // render posts shell
    postContainer.innerHTML = posts.map(p => {
      const date = toLocaleDate(p.CreatedAt);
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
          ${p.ImageURL ? `<div class="post-image-wrap">
            <img src="${p.ImageURL}" class="post-image" alt="">
          </div>` : ""}
          <div class="post-actions">
            <button class="comment-toggle">💬 Comment</button>
            <button class="post-menu-btn" aria-label="Post options">⋯</button>
          </div>
          <div class="post-menu-dropdown" hidden>
            <button class="post-menu-edit">✏️ Edit</button>
            <button class="post-menu-delete">🗑️ Delete</button>
          </div>
          <div class="comments-section" hidden>
            <div class="comment-list"></div>
            <textarea class="new-comment" placeholder="Write a comment..."></textarea>
            <button class="submit-comment">Post Comment</button>
          </div>
        </div>
      `;
    }).join("");

    // wire up each post’s comments
    postContainer.querySelectorAll(".post-item").forEach(item => {
      const postID = item.dataset.postId;
      const toggle = item.querySelector(".comment-toggle");
      const section = item.querySelector(".comments-section");
      const listEl = item.querySelector(".comment-list");
      const input = item.querySelector(".new-comment");
      const submitBtn = item.querySelector(".submit-comment");

      toggle.addEventListener("click", () => {
        if (section.hidden) {
          loadComments(postID, listEl);
        }
        section.hidden = !section.hidden;
      });

      // post new comment
      submitBtn.addEventListener("click", async () => {
        const text = input.value.trim();
        if (!text) return alert("Please write a comment.");
        if (!currentUser) {
          alert("You must log in to comment.");
          return window.location.href = "/html/login.html";
        }
        const resp = await fetch(`${apiBaseUrl}/posts/${postID}/comments`, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            UserID:  currentUser.userID,
            content: text
          })
        });
        if (!resp.ok) {
          return alert("Failed to post comment");
        }
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

postContainer.querySelectorAll(".post-item").forEach(item => {
  const postID    = item.dataset.postId;
  const menuBtn   = item.querySelector(".post-menu-btn");
  const dropdown  = item.querySelector(".post-menu-dropdown");
  const deleteBtn = item.querySelector(".post-menu-delete");

  // toggle dropdown
  menuBtn.addEventListener("click", e => {
    e.stopPropagation();
    dropdown.hidden = !dropdown.hidden;
  });

  // clicking anywhere else should close it
  document.addEventListener("click", () => {
    dropdown.hidden = true;
  });

  // DELETE
  deleteBtn.addEventListener("click", async () => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`${apiBaseUrl}/posts/${postID}`, {
      method: "DELETE",
      headers: { 
        "Authorization": `Bearer ${token}` 
      }
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      return alert(error || "Could not delete post");
    }
    item.remove();
  });
});
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
document.addEventListener("DOMContentLoaded", loadPosts);

window.addEventListener("load", async () => {
  currentUser = await getToken(token);
});
