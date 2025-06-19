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
const path = require('path');
const fs = require('fs');

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

const logPath = path.join(__dirname, 'server-log.txt');
function logToFile(...args) {
  const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  fs.appendFileSync(logPath, msg + '\n');
}

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});