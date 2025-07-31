const postModel = require("../models/posts_model");

// ─── Posts ───────────────────────────────────────────────────────────────────
async function getAllPosts(req, res) {
  try {
    const { date, owner } = req.query; // capture filters from query params
    const posts = await postModel.getAllPosts(date, owner);
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

    const updatedPost = await postModel.getPostById(postID);
    res.status(200).json(updatedPost);

  } catch (err) {
    console.error("Update Post Error:", err);
    res.status(500).json({ error: "Failed to update post" });
  }
}

async function updateComment(req, res) {
  const { commentID } = req.params;
  const { content } = req.body;
  const userID = req.user.userID;

  try {
    // Ensure comment belongs to user before updating
    const existing = await postModel.getCommentByID(commentID);
    if (!existing) return res.status(404).json({ error: "Comment not found" });
    if (existing.UserID !== userID) return res.status(403).json({ error: "Not authorised" });

    await postModel.updateComment(commentID, content);
    res.json({ success: true });
  } catch (err) {
    console.error("Update comment error:", err);
    res.status(500).json({ error: "Failed to update comment" });
  }
}

async function deleteComment(req, res) {
  const { postID, commentID } = req.params;
  const userID = req.user.userID; 

  try {
    const deleted = await postModel.deleteComment(postID, commentID, userID);
    if (!deleted) {
      return res.status(403).json({ error: "Not allowed or comment not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ error: "Server error while deleting comment" });
  }
}

async function likePost(req, res) {
  const { postID } = req.params;
  const userID = req.user.userID;

  try {
    const existing = await postModel.getLikes(postID, userID);
    if (existing?.Liked > 0) {
      // Already liked, treat as success
      return res.status(200).json({ message: "Already liked" });
    }

    await postModel.addLike(postID, userID);
    res.status(201).json({ message: "Liked" });
  } catch (err) {
    console.error("Like Post Error:", err);
    res.status(500).json({ error: "Failed to like post" });
  }
}

async function unlikePost(req, res) {
  const postID = parseInt(req.params.postID);
  const userID = req.user?.userID || req.body.userID;

  console.log(`unlikePost: postID=${postID}, userID=${userID}`);

  try {
    const deleted = await postModel.removeLike(postID, userID);
    if (deleted > 0) {
      console.log(`Unlike successful`);
      return res.status(200).json({ message: "Post unliked" });
    } else {
      console.warn(`No like found to delete`);
      return res.status(404).json({ message: "Like not found" });
    }
  } catch (err) {
    console.error("Unlike error:", err);
    res.status(500).json({ error: "Failed to unlike post" });
  }
}

async function getLikes(req, res) {
  const { postID } = req.params;
  const userID = req.user?.userID; // ← pulled from JWT

  try {
    const result = await postModel.getLikes(postID, userID);
    res.json(result);
  } catch (err) {
    console.error("Get Likes Error:", err);
    res.status(500).json({ error: "Failed to fetch like status" });
  }
}

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  getCommentsForPost,
  createCommentForPost,
  deletePost,
  updatePost,
  updateComment,
  deleteComment,
  likePost,
  unlikePost,
  getLikes
};
