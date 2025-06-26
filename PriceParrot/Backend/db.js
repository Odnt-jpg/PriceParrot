const mysql = require('mysql2');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};
console.log('DB Config:', dbConfig);
const pool = mysql.createPool(
  dbConfig
);
console.log(pool);
module.exports = pool.promise();