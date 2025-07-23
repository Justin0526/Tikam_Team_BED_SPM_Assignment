const postModel = require("../models/posts_model");

// ─── Posts ───────────────────────────────────────────────────────────────────
async function getAllPosts(req, res) {
  try {
    const posts = await postModel.getAllPosts();
    res.json(posts);
  } catch (err) {
    console.error("getAllPosts:", err);
    res.status(500).json({ error: "Error retrieving posts" });
  }
}

async function getPostById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const post = await postModel.getPostById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    console.error("getPostById:", err);
    res.status(500).json({ error: "Error retrieving post" });
  }
}

async function createPost(req, res) {
  try {
    const UserID   = req.user.userID;
    const { Content, ImageURL } = req.body;

    const newPost = await postModel.createPost({ UserID, Content, ImageURL });
    res.status(201).json(newPost);
  } catch (err) {
    console.error("createPost:", err);
    res.status(500).json({ error: "Error creating post" });
  }
}

// ─── Comments ────────────────────────────────────────────────────────────────
async function getCommentsForPost(req, res) {
  try {
    const postID = parseInt(req.params.postID, 10);
    const comments = await postModel.getCommentsByPostID(postID);
    res.json(comments);
  } catch (err) {
    console.error("getCommentsForPost:", err);
    res.status(500).json({ error: "Error retrieving comments" });
  }
}

async function createCommentForPost(req, res) {
  try {
    const postID = parseInt(req.params.postID, 10);
    const userID = req.user.userID;
    const content = req.body.content;          

    if (!content) {
      return res.status(400).json({ error: "content is required" });
    }

    const newComment = await postModel.createComment({
      PostID:  postID,
      UserID:  userID,
      Content: content
    });

    res.status(201).json(newComment);
  } catch (err) {
    console.error("createCommentForPost:", err);
    res.status(500).json({ error: "Error creating comment" });
  }
}
//delete post controller
async function deletePost(req, res) {
  const postID = parseInt(req.params.id);
  const userID = req.user?.userID;
  if (isNaN(postID)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }
  try {
    // get post and check if it exists
    const post = await postModel.getPostById(postID);
    if (!post) return res.status(404).json({ error: "Post not found" });
    // check ownership
    if (post.UserID !== userID) {
      return res.status(403).json({ error: "Not authorised to delete this post" });
    }
    // proceed to delete
    const deleted = await postModel.deletePostById(postID);
    if (deleted === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete Post Error:", err);
    res.status(500).json({ error: "Server error while deleting post" });
  }
}

async function updatePost(req, res) {
  try {
    const postID = parseInt(req.params.id);
    const userID = req.user.userID;
    const { Content, ImageURL } = req.body;

    if (!Content) {
      return res.status(400).json({ error: "Content is required." });
    }

    const updated = await postModel.updatePostById(postID, userID, Content, ImageURL);
    if (!updated) {
      return res.status(403).json({ error: "Not allowed to edit this post." });
    }

    res.status(200).json({ message: "Post updated successfully" });
  } catch (err) {
    console.error("Update Post Error:", err);
    res.status(500).json({ error: "Failed to update post" });
  }
}

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  getCommentsForPost,
  createCommentForPost,
  deletePost,
  updatePost
};
