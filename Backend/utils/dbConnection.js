const mysql = require("mysql2")

function dbConnection() {
    const dbConn = mysql.createConnection({
        host: process.env.LCL_DB_HOST,
        user: process.env.LCL_DB_USER,
        password: process.env.LCL_DB_PASS,
        multipleStatements: true
    })
    dbConn.connect((err) => { err ? console.log(err.message) : console.log(`connected with db user ${process.env.LCL_DB_USER}`) })
    return dbConn;
}

module.exports = dbConnection;