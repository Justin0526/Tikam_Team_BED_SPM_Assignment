const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getAllPosts() {
  const pool  = await sql.connect(dbConfig);
  const result = await pool.request().query(`
    SELECT 
      p.PostID,
      p.UserID, 
      u.FullName AS Author,
      p.Content,
      p.ImageURL,
      p.CreatedAt
    FROM dbo.Posts p
    JOIN dbo.Users u ON p.UserID = u.UserID
    ORDER BY p.CreatedAt DESC
  `);
  return result.recordset;
}

async function getPostById(id) {
  const pool  = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("id", sql.Int, id)
    .query(`
      SELECT
        p.PostID,
        p.UserID,
        u.FullName AS Author,
        p.Content,
        p.ImageURL,
        p.CreatedAt
      FROM dbo.Posts p
      JOIN dbo.Users u ON p.UserID = u.UserID
      WHERE p.PostID = @id
    `);
  return result.recordset[0] || null;
}

async function createPost({ UserID, Content, ImageURL }) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("UserID",   sql.Int,     UserID)
    .input("Content",  sql.VarChar(500), Content)
    .input("ImageURL", sql.VarChar(1024), ImageURL || null)
    .query(`
      INSERT INTO dbo.Posts (UserID, Content, ImageURL, CreatedAt)
      VALUES (@UserID, @Content, @ImageURL, GETDATE());
      SELECT SCOPE_IDENTITY() AS PostID;
    `);

  const newId = result.recordset[0].PostID;
  return getPostById(newId);
}

// ─── Comments ──────────────────────────────────────────────────────────────────
async function getAllComments() {
  const pool = await sql.connect(dbConfig);
  const { recordset } = await pool.request().query(`
    SELECT
      c.CommentID,
      c.PostID,
      c.UserID,
      c.Content,
      c.CommentDateTime AS createdAt
    FROM dbo.Comments c
    ORDER BY c.CommentDateTime DESC
  `);
  return recordset;
}

async function getCommentByID(commentID) {
  const pool = await sql.connect(dbConfig);
  const { recordset } = await pool
    .request()
    .input("CommentID", sql.Int, commentID)
    .query(`
      SELECT
        c.CommentID,
        c.PostID,
        c.UserID,
        c.Content,
        c.CommentDateTime AS createdAt
      FROM dbo.Comments c
      WHERE c.CommentID = @CommentID
    `);
  return recordset[0] || null;
}

async function getCommentsByPostID(postID) {
  const pool = await sql.connect(dbConfig);
  const { recordset } = await pool
    .request()
    .input("PostID", sql.Int, postID)
    .query(`
      SELECT 
        c.CommentID,
        c.PostID,
        c.UserID,
        u.Username              AS userName,
        c.Content,
        c.CommentDateTime       AS createdAt
      FROM dbo.Comments c
      JOIN dbo.Users u          ON u.UserID = c.UserID
      WHERE c.PostID = @PostID
      ORDER BY c.CommentDateTime ASC
    `);
  return recordset;
}

async function createComment({ PostID, UserID, Content }) {
  const pool = await sql.connect(dbConfig);
  const { recordset } = await pool
    .request()
    .input("PostID",  sql.Int,    PostID)
    .input("UserID",  sql.Int,    UserID)
    .input("Content", sql.VarChar(500), Content)
    .query(`
      INSERT INTO dbo.Comments (PostID, UserID, Content, CommentDateTime)
      OUTPUT inserted.CommentID,
             inserted.PostID,
             inserted.UserID,
             inserted.Content,
             inserted.CommentDateTime   AS createdAt
      VALUES (@PostID, @UserID, @Content, GETDATE());
    `);
  return recordset[0];
}

//delete post model
async function deletePostById(postID) {
  try {
    const pool = await sql.connect(dbConfig); 
    const result = await pool
      .request()
      .input("postID", sql.Int, postID)
      .query("DELETE FROM Posts WHERE PostID = @postID");
    return result.rowsAffected[0]; // 1 if deleted, 0 if not found
  } catch (err) {
    throw err;
  }
}

async function updatePostById(postID, userID, content, imageURL) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("PostID", sql.Int, postID)
      .input("UserID", sql.Int, userID)
      .input("Content", sql.VarChar(500), content)
      .input("ImageURL", sql.VarChar(500), imageURL || null)
      .query(`
        UPDATE Posts
        SET Content = @Content, ImageURL = @ImageURL
        WHERE PostID = @PostID AND UserID = @UserID
      `);

    return result.rowsAffected[0] > 0;
  } catch (err) {
    console.error("Model: updatePostById error", err);
    throw err;
  }
}

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  getAllComments,
  getCommentByID,
  getCommentsByPostID,
  createComment,
  deletePostById,
  updatePostById
};

