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
    const content = req.body.content;            // <— lowercase!

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


module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  getCommentsForPost,
  createCommentForPost
};
