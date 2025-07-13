const postModel = require("../models/posts_model");

async function getAllPosts(req, res) {
  try {
    const posts = await postModel.getAllPosts();
    res.json(posts);
  } catch (err) {
    console.error("Controller getAllPosts error:", err);
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
    console.error("Controller getPostById error:", err);
    res.status(500).json({ error: "Error retrieving post" });
  }
}

async function createPost(req, res) {
  try {
    const userID = req.user.userID; // Get userID from decoded token
    const { Content, ImageURL } = req.body;

    const newPost = await postModel.createPost({ userID, Content, ImageURL });
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
