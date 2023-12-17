const dotenv = require("mysql2/promise");
require("dotenv").config();

const mysql = require("mysql2");

const dbConfig = {
    host:
        process.env.DB_HOST ||
        "sqlclassdb-instance-1.cqjxl5z5vyvr.us-east-2.rds.amazonaws.com",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || "10000"),
};

const connectionPool = mysql.createPool(dbConfig);

module.exports = connectionPool;
