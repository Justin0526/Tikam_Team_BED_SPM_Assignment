const postModel = require("../models/posts_model");

// Get all posts
async function getAllPosts(req, res) {
  try {
    const posts = await postModel.getAllPosts();
    res.json(posts);
  } catch (err) {
    console.error("Controller getAllPosts error:", err);
    res.status(500).json({ error: "Error retrieving posts" });
  }
}

// Get a single post by ID
async function getPostById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const post = await postModel.getPostById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    console.error("Controller getPostById error:", err);
    res.status(500).json({ error: "Error retrieving post" });
  }
}

// Create a new post (requires authentication)
async function createPost(req, res) {
  try {
    const UserID = req.user.userID; 
    const { Content, ImageURL } = req.body;

    const newPost = await postModel.createPost({ UserID, Content, ImageURL });
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Controller createPost error:", err);
    res.status(500).json({ error: "Error creating post" });
  }
}

module.exports = {
  getAllPosts,
  getPostById,
  createPost
};
