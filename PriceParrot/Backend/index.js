const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const retailerRoutes = require('./routes/retailerRoutes')
const adminRoutes = require('./routes/adminRoutes');
const schedule = require('node-schedule');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const logPath = path.join(__dirname, 'server-log.txt');
// Temporarily disable writing to server-log.txt by patching logToFile to a no-op
function logToFile() {}

// Patch console.log and console.error to also write to server-log.txt
const origLog = console.log;
const origError = console.error;
console.log = (...args) => {
  logToFile(...args);
  origLog(...args);
};
console.error = (...args) => {
  logToFile(...args);
  origError(...args);
};

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes); // Routes for login and registration
app.use('/api/products', productRoutes); // Routes for products
app.use('/api/users', userRoutes); // Routes for user
app.use(retailerRoutes);// Need to add for retailers
app.use(adminRoutes); // Admin routes for SQL/table access

// Schedule the scraper to run at 8am and 5pm every day
schedule.scheduleJob('0 8,17 * * *', () => {
  const scriptPath = path.join(__dirname, 'mainrun.js');
  exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('Scheduled scraper error:', error.message);
    } else {
      console.log('Scheduled scraper ran successfully.');
    }
  });
});

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Log server start
fs.appendFileSync(logPath, `[${new Date().toISOString()}] Server is up and running.\n`);

// Example: Log DB connection (for mysql2/promise pool)
const db = require('./db');
db.getConnection()
  .then(conn => {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] Database connected successfully.\n`);
    conn.release();
  })
  .catch((err) => {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] Database connection failed: ${err.message}\n`);
  });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});