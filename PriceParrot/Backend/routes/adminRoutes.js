const express = require('express');
const router = express.Router();
const db = require('../db');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Get all table names
router.get('/api/tables', async (req, res) => {
  try {
    const [results] = await db.query('SHOW TABLES');
    const tables = results.map(row => Object.values(row)[0]);
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get data from selected table
router.get('/api/table/:name', async (req, res) => {
  try {
    const table = mysql.escapeId(req.params.name);
    const [results] = await db.query(`SELECT * FROM ${table} LIMIT 100`);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create row
router.post('/api/table/:name', (req, res) => {
  const table = mysql.escapeId(req.params.name);
  const data = req.body;
  const columns = Object.keys(data).map(k => mysql.escapeId(k)).join(', ');
  const values = Object.values(data);
  const placeholders = values.map(() => '?').join(', ');

  db.query(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, insertId: result.insertId });
  });
});

// Update row by ID (assumes 'id' as primary key)
router.put('/api/table/:name/:id', (req, res) => {
  const table = mysql.escapeId(req.params.name);
  const id = req.params.id;
  const data = req.body;
  const updates = Object.keys(data).map(k => `${mysql.escapeId(k)} = ?`).join(', ');
  const values = Object.values(data);

  db.query(`UPDATE ${table} SET ${updates} WHERE id = ?`, [...values, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Delete row by ID
router.delete('/api/table/:name/:id', (req, res) => {
  const table = mysql.escapeId(req.params.name);
  const id = req.params.id;

  db.query(`DELETE FROM ${table} WHERE id = ?`, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});



// POST /api/run-scraper - Run the mainrun.js scraper script
router.post('/api/run-scraper', async (req, res) => {
  const { exec } = require('child_process');
  const path = require('path');
  const scriptPath = path.join(__dirname, '../mainrun.js');
  exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message, stderr });
    }
    res.json({ success: true, stdout, stderr });
  });
});

// SSE endpoint for live log streaming
let sseClients = [];
router.get('/api/console-log-stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();
  sseClients.push(res);

  // Send the current log on connect
  const logPath = path.join(__dirname, '../server-log.txt');
  fs.readFile(logPath, 'utf8', (err, data) => {
    if (!err && data) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  });

  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

// Watch the log file for changes and broadcast updates
const logPathSSE = path.join(__dirname, '../server-log.txt');
fs.watchFile(logPathSSE, { interval: 1000 }, (curr, prev) => {
  if (curr.size > prev.size) {
    fs.open(logPathSSE, 'r', (err, fd) => {
      if (err) return;
      const buffer = Buffer.alloc(curr.size - prev.size);
      fs.read(fd, buffer, 0, buffer.length, prev.size, (err2, bytesRead, buff) => {
        if (!err2 && bytesRead > 0) {
          const newLog = buff.toString('utf8', 0, bytesRead);
          sseClients.forEach(client => {
            client.write(`data: ${JSON.stringify(newLog)}\n\n`);
          });
        }
        fs.close(fd, () => {});
      });
    });
  }
});

module.exports = router;
