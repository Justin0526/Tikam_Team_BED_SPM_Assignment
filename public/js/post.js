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

    listEl.innerHTML = "";

    comments.forEach(comment => {
      const commentItem = document.createElement("div");
      commentItem.classList.add("comment-item");

      const isOwner = currentUser && currentUser.userID === comment.UserID;

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
        </div>
      ` : ""}
      `;

      listEl.appendChild(commentItem);

      // Attach edit handlers if user owns the comment
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
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });

          if (!res.ok) {
            alert("Failed to delete comment.");
            return;
          }

          await loadComments(postID, listEl); // Reload comments after deletion
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

          if (!res.ok) {
            return alert("Failed to update comment.");
          }

          loadComments(postID, listEl);
        });
      }
    });
  } catch (err) {
    console.error("Error loading comments:", err);
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
          ${
            isOwner
              ? `
              <div class="post-menu-wrapper">
                <button class="post-menu-btn" aria-label="Post options">⋯</button>
                <div class="post-menu-dropdown" hidden>
                  <button class="post-menu-edit">✏️ Edit</button>
                  <button class="post-menu-delete">🗑️ Delete</button>
                </div>
              </div>
            `
              : ""
          }
        </div>
        ${
          isOwner
            ? `
            <div class="edit-post-form" hidden>
              <textarea class="edit-content">${p.Content}</textarea>
              ${
                p.ImageURL
                  ? `<img src="${p.ImageURL}" class="edit-image-preview">`
                  : ""
              }
              <input type="file" class="edit-image-input" hidden>
              <button class="change-image-btn">Change Picture</button>
              <div class="edit-btn-row">
                <button class="cancel-edit-btn">Cancel</button>
                <button class="save-edit-btn">Save Changes</button>
              </div>
            </div>
          `
            : ""
        }
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
        dropdown.hidden = true;
        document.querySelectorAll(".edit-post-form").forEach(f => f.hidden = true);
        editForm.hidden = false;
        });

        changeBtn.addEventListener("click", () => editInput.click());

        editInput.addEventListener("change", async () => {
          const file = editInput.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = evt => {
            if (editPreview) {
              editPreview.src = evt.target.result;
              editPreview.style.display = "block";
            }
          };
          reader.readAsDataURL(file);

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
        if (submitBtn.disabled) return;

        const text = input.value.trim();
        if (!text) {
          alert("Please write a comment.");
          return;
        }

        if (!currentUser) {
          alert("You must log in to comment.");
          return window.location.href = "/html/login.html";
        }

        submitBtn.disabled = true;

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

        if (!resp.ok) {
          alert("Failed to post comment");
          submitBtn.disabled = false;
          return;
        }

        input.value = "";
        await loadComments(postID, listEl);
        submitBtn.disabled = false;
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
  shareBtn.disabled = true; // disable immediately

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
      const uplRes = await fetch(`${apiBaseUrl}/api/upload`, {
        method: "POST",
        body: form
      });
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

  contentEl.value = "";
  imageInput.value = "";
  preview.style.display = removeBtn.style.display = "none";
  await loadPosts();

  shareBtn.disabled = false; // re-enable after success
});


// ─── Init & Auth ──────────────────────────────────────────────────────────────
// 1) First load public posts
window.addEventListener("load", async () => {
  currentUser = await getToken(token);
  loadPosts(); 
});
