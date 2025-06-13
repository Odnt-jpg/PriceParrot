const express = require('express');
const router = express.Router();
const db = require('../db');

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


router.get('/api/retailers', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, ra.address, ra.latitude, ra.longitude
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
module.exports = router;
