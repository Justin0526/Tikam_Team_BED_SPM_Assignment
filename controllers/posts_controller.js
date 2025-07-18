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
async function getAllComments(req, res) {
  try {
    const comments = await postModel.getAllCommentss();
    res.json({comments})
  } catch (err) {
    console.error("Controller getAllPosts error:", err)
     res.status(500).json({ error: "Error retrieving comments" });
  }
}

async function getCommentByID(req, res){
  try {
    const id = parseInt(req.params.id, 10)
    const comment = await postModel.getCommentByID(id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    res.json(post);
  } catch (err) {
    console.error("Controller getCommentById error:", err);
    res.status(500).json({ error: "Error retrieving comment" });
  }
}
async function createComment(req, res) {
  try {
    const UserID = req.user.userID;
    const PostID = req.posts.postID

    const newComment = await postModel.createComment({UserID, Content})
    res.status(201).json(newComment);
  } catch (err) {
    console.error("Controller createComment error:", err);
    res.status(500).json({error: "Error creating comment"});
  }
}
async function getCommentsByPostID(req, res) {
  try {
    const postID  = parseInt(req.params.postID,  10);
    const comments = await postModel.getCommentsByPostID(postID);
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching comments" });
  }
}

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  getAllComments,
  getCommentByID,
  createComment,
  getCommentsByPostID
};
