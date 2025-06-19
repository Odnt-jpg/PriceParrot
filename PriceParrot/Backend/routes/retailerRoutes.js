const express = require('express');
const router = express.Router();
const db = require('../db');

if (global.origLog && global.origError) {
  console.log = global.origLog;
  console.error = global.origError;
}

// GET /api/retailer/:id - Get all details for a retailer
router.get('/api/retailer/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Fetching retailer details for ID:', id);
  try {
    const [retailers] = await db.query(
      `SELECT r.*, ra.address, ra.latitude, ra.longitude
       FROM retailers r
       LEFT JOIN retailer_addresses ra ON r.id = ra.retailer_id
       WHERE r.id = ?`,
      [id]
    );
    if (retailers.length === 0) {
      return res.status(404).json({ error: 'Retailer not found.' });
    }
    // If multiple addresses, group them
    const retailer = {
      id: retailers[0].id,
      name: retailers[0].name,
      url: retailers[0].url,
      image: retailers[0].logo_url,
      phone_number: retailers[0].phone_number,
      opening_hours: retailers[0].opening_hours,
      addresses: retailers
      .filter(r => r.address)
      .map(r => ({
        address: r.address,
        latitude: r.latitude,
        longitude: r.longitude
      }))
      };
    res.json(retailer);
  } catch (err) {
    console.error('Error fetching retailer:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Returns all retailers in the database
router.get('/api/retailers', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, r.opening_hours, r.phone_number, ra.address, ra.latitude, ra.longitude
       FROM retailers r
       LEFT JOIN retailer_addresses ra ON r.id = ra.retailer_id`
    );
    if (rows.length === 0) {
      return res.json([]);
    }
    // Group addresses by retailer
    const retailersMap = {};
    rows.forEach(r => {
      if (!retailersMap[r.id]) {
        retailersMap[r.id] = {
          id: r.id,
          name: r.name,
          image: r.logo_url,
          addresses: []
        };
      }
      if (r.address) {
        retailersMap[r.id].addresses.push({
          address: r.address,
          latitude: r.latitude,
          longitude: r.longitude
        });
      }
    });
    res.json(Object.values(retailersMap));
  } catch (err) {
    console.error('Error fetching retailers:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/retailers/logo/:id - Get a retailer's logo by retailer id
router.get('/api/retailers/logo/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT logo_url FROM retailers WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Retailer not found.' });
    }
    res.json({ logo_url: rows[0].logo_url });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/retailer-addresses - Get all retailer addresses with lat/lng
router.get('/api/retailer-addresses', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT address, latitude, longitude FROM retailer_addresses'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching retailer addresses:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/retailer-addresses/:id - Get addresses, latitude, and longitude for a specific retailer
router.get('/api/retailer-addresses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT address, latitude, longitude FROM retailer_addresses WHERE retailer_id = ?',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching retailer addresses by id:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
