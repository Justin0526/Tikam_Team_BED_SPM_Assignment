const sql = require("mssql");
const dbConfig = require("./dbConfig");

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log("Connected to SQL Server (Bookmark DB)");
        return pool;
    })
    .catch(err => {
        console.error("Database Connection Failed - Bookmark DB:", err);
        throw err;
    });

module.exports = {
    sql,
    poolPromise
};
