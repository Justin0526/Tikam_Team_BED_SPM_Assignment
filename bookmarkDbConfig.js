const sql = require("mssql");
const dbConfig = require("./dbConfig");

const poolPromise = sql.connect(dbConfig); // just connect once and share

module.exports = {
    sql,
    poolPromise
};
