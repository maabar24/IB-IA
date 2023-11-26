const mysql = require('mysql2');

const dbConfig = {
    host: "sqlclassdb-instance-1.cqjxl5z5vyvr.us-east-2.rds.amazonaws.com",
    port: "3306",
    user: "maabar24",
    password: "szPxj5T3LHQd",
    database: "ib_2324_maabar24",
    connectTimeout: "10000"
}

const connection = mysql.createConnection(dbConfig);

module.exports = connection;