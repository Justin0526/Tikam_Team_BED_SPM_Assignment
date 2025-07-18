const sql      = require("mssql");
const dbConfig = require("../dbConfig");

async function getAllPosts() {
  const pool  = await sql.connect(dbConfig);
  const result = await pool.request().query(`
    SELECT 
      p.PostID,
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

async function getAllComments() {
  const pool = await poolPromise;
  const result = await pool.request()
    .query(`
      SELECT 
        CommentID,
        PostID,
        UserID,
        Content,
        CommentDateTime
      FROM Comments
      ORDER BY CommentDateTime DESC
    `);
  return result.recordset;
}

async function getCommentByID(commentID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("CommentID", sql.Int, commentID)
    .query(`
      SELECT 
        CommentID,
        PostID,
        UserID,
        Content,
        CommentDateTime
      FROM Comments
      WHERE CommentID = @CommentID
    `);
  return result.recordset[0] || null;
}

// — Create a new comment on a given post
async function createComment({ UserID, PostID, Content }) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("UserID",  sql.Int,         UserID)
    .input("PostID",  sql.Int,         PostID)
    .input("Content", sql.VarChar(100), Content)
    .query(`
      INSERT INTO Comments (UserID, PostID, Content, CommentDateTime)
      OUTPUT 
        inserted.CommentID,
        inserted.UserID,
        inserted.PostID,
        inserted.Content,
        inserted.CommentDateTime
      VALUES (@UserID, @PostID, @Content, GETDATE())
    `);
  return result.recordset[0];
}

async function getCommentsByPostID(postID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("PostID", sql.Int, postID)
    .query(`
      SELECT CommentID, PostID, UserID, Content, CommentDateTime
      FROM Comments
      WHERE PostID = @PostID
      ORDER BY CommentDateTime
    `);
  return result.recordset;
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

