// public/js/post.js

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const imageInput = document.getElementById("postImage");
const preview    = document.getElementById("imagePreview");
const removeBtn  = document.getElementById("removeImageBtn");
const shareBtn   = document.querySelector(".share-btn");
const contentEl  = document.getElementById("postContent");

// Preview logic
imageInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) {
    preview.style.display = removeBtn.style.display = "none";
    return;
  }
  const reader = new FileReader();
  reader.onload = evt => {
    preview.src           = evt.target.result;
    preview.style.display = "block";
    removeBtn.style.display = "inline-block";
  };
  reader.readAsDataURL(file);
});

removeBtn.addEventListener("click", () => {
  imageInput.value = "";
  preview.style.display = removeBtn.style.display = "none";
});

// Load & render posts
async function loadPosts() {
  try {
    const res = await fetch("/posts");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();

    const container = document.querySelector(".posts-list");
    container.innerHTML = "";

    posts.forEach(p => {
      const postEl = document.createElement("div");
      postEl.classList.add("post-item");

      // Header
      const hdr = document.createElement("div");
      hdr.classList.add("post-header");
      hdr.innerHTML = `
        <div class="avatar"></div>
        <div class="meta">
          <span class="author">${p.Author}</span>
          <span class="date">${
            new Date(p.CreatedAt)
              .toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })
          }</span>
        </div>`;
      postEl.appendChild(hdr);

      // Content
      const body = document.createElement("div");
      body.classList.add("post-body");
      body.textContent = p.Content;
      postEl.appendChild(body);

      // Image
      if (p.ImageURL) {
        const wrap = document.createElement("div");
        wrap.classList.add("post-image-wrap");
        const img = document.createElement("img");
        img.src = p.ImageURL;
        img.alt = "Post image";
        img.classList.add("post-image");
        wrap.appendChild(img);
        postEl.appendChild(wrap);
      }

      container.appendChild(postEl);
    });
  } catch (err) {
    console.error("Error loading posts:", err);
    document.querySelector(".posts-list")
      .innerHTML = `<p class="error">Failed to load posts.</p>`;
  }
}

// Share‐post handler
shareBtn.addEventListener("click", async () => {
  const content = contentEl.value.trim();
  if (!content) return alert("Please write something.");

  let imageURL = null;
  if (preview.src && preview.style.display !== "none") {
    imageURL = preview.src;
  }

  const payload = { UserID:1, Content:content, ImageURL:imageURL };
  const res = await fetch("/posts", {
    method:  "POST",
    headers: { "Content-Type":"application/json" },
    body:    JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json();
    return alert(err.error || "Failed to share post");
  }

  contentEl.value = "";
  imageInput.value = "";
  preview.style.display = removeBtn.style.display = "none";
  loadPosts();
});

// Init
document.addEventListener("DOMContentLoaded", loadPosts);
