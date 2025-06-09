const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'power123',
  database: 'priceparrot'
});

// Export promise-based pool
module.exports = pool.promise();