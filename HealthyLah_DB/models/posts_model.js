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

module.exports = {
  getAllPosts,
  getPostById,
  createPost
};
