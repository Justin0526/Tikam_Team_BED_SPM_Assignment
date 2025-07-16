// public/js/post.js

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
    const res   = await fetch(`${apiBaseUrl}/posts`);
    const posts = await res.json();
    container.innerHTML = posts.length
      ? posts.map(p => `
          <div class="post-item">
            <div class="post-header">
              <div class="avatar"></div>
              <div class="meta">
                <span class="author">${p.Author}</span>
                <span class="date">${
                  new Date(p.CreatedAt)
                    .toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})
                }</span>
              </div>
            </div>
            <div class="post-body">${p.Content}</div>
            ${p.ImageURL ? `
              <div class="post-image-wrap">
                <img src="${p.ImageURL}" class="post-image" alt="Post image">
              </div>` : ""}
          </div>
        `).join("")
      : "<p>No posts yet.</p>";
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
