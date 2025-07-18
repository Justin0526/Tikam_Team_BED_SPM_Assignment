
// ─── Config & State ─────────────────────────────────────────────────────────
const apiBaseUrl = "http://localhost:3000";
let currentUser   = null;

// ─── DOM Nodes ────────────────────────────────────────────────────────────────
const imageInput = document.getElementById("postImage");
const preview    = document.getElementById("imagePreview");
const removeBtn  = document.getElementById("removeImageBtn");
const shareBtn   = document.querySelector(".share-btn");
const contentEl  = document.getElementById("postContent");
const container  = document.querySelector(".posts-list");

// ─── Load & Render Public Posts ───────────────────────────────────────────────
async function loadPosts() {
  try {
    const res = await fetch(`${apiBaseUrl}/posts`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const posts = await res.json();

    // if there's zero posts
    if (!Array.isArray(posts) || posts.length === 0) {
      container.innerHTML = `<p>No posts yet.</p>`;
      return;
    }

    // otherwise build the HTML
    container.innerHTML = posts
      .map(p => {
        // format the date properly
        const humanDate = new Date(p.CreatedAt)
          .toLocaleDateString("en-GB", {
            day:   "numeric",
            month: "short",
            year:  "numeric"
          });

        return `
          <div class="post-item" data-post-id="${p.PostID}">
            <div class="post-header">
              <div class="avatar"></div>
              <div class="meta">
                <span class="author">${p.Author}</span>
                <span class="date">${humanDate}</span>
              </div>
            </div>
            <div class="post-body">${p.Content}</div>
            ${p.ImageURL ? `
              <div class="post-image-wrap">
                <img src="${p.ImageURL}" class="post-image" alt="Post image">
              </div>` : ""}
            <div class="post-actions">
              <button class="comment-toggle">💬 Comment</button>
              <button class="like-btn">👍</button>
              <button class="share-btn-outer">↗️</button>
            </div>
            <div class="comments-section" hidden>
              <div class="comment-list"></div>
              <textarea class="new-comment" placeholder="Write a comment..."></textarea>
              <button class="submit-comment">Post Comment</button>
            </div>
          </div>
        `;
      })
      .join("");

    // wire up comment‐toggle & comment submission for each post
    container.querySelectorAll(".post-item").forEach(item => {
      const postID = item.dataset.postId;
      const toggle = item.querySelector(".comment-toggle");
      const section = item.querySelector(".comments-section");
      const list = item.querySelector(".comment-list");
      const submitBtn = item.querySelector(".submit-comment");
      const input = item.querySelector(".new-comment");

      // fetch & render existing comments
      fetch(`${apiBaseUrl}/posts/${postID}/comments`)
        .then(r => r.json())
        .then(comments => {
          list.innerHTML = comments
            .map(c => `
              <div class="comment-item">
                <div class="meta">
                  <span class="author">${c.userName}</span>
                  <span class="date">${toLocaleDate(c.createdAt)}</span>
                </div>
                <div class="body">${c.content}</div>
              </div>
            `).join("");
        })
        .catch(console.error);

      // show/hide comment area
      toggle.addEventListener("click", () => {
        section.hidden = !section.hidden;
      });

      // post a new comment
      submitBtn.addEventListener("click", async () => {
        const text = input.value.trim();
        if (!text) return alert("Please write a comment.");
        const userID = currentUser.userID || currentUser.sub;
        if (!userID) {
          alert("Please log in to comment.");
          return window.location.href = "/html/login.html";
        }

        const resp = await fetch(`${apiBaseUrl}/posts/${postID}/comments`, {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            UserID: currentUser.userID,
            PostID: postID,
            Content: text 
          })
        });
        if (!resp.ok) {
          return alert("Failed to post comment");
        }
        const newComment = await resp.json();
        list.insertAdjacentHTML("beforeend", `
          <div class="comment-item">
            <div class="meta">
              <span class="author">${currentUser.username}</span>
              <span class="date">just now</span>
            </div>
            <div class="body">${newComment.content}</div>
          </div>
        `);
        input.value = "";
      });
    });

  } catch (err) {
    console.error("Error loading posts:", err);
    container.innerHTML = `<p class="error">Failed to load posts.</p>`;
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
    preview.src             = evt.target.result;
    preview.style.display   = "block";
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
