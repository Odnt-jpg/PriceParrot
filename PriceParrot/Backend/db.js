const mysql = require('mysql2');

let db;

function handleDisconnect() {
  db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'power123',
    database: 'priceparrot',
  });

  db.connect((err) => {
    if (err) {
      console.error('Database connection error:', err);
      setTimeout(handleDisconnect, 2000); // Retry connection after 2 seconds
    } else {
      console.log('Connected to the database.');
    }
  });

  db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect(); // Reconnect on connection loss
    } else {
      throw err; // Throw other errors
    }
  });
}

handleDisconnect();

module.exports = db;