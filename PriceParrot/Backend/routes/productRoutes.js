const express = require('express');
const db = require('../db'); // Import your database connection

const router = express.Router();

//get all products
router.get('/allproducts', (req, res) => {
  const query = 'SELECT * FROM products ';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }

    res.status(200).json(results);
  });
});

// Get featured products
router.get('/featured', (req, res) => {
  const query = 'SELECT * FROM products LIMIT 10';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }

    res.status(200).json(results);
  });
});

// Get trending products
router.get('/trending', (req, res) => {
  const query = `
    SELECT p.id, p.name, p.description, p.image_url, COUNT(rv.product_id) AS view_count
    FROM recently_viewed rv
    JOIN products p ON rv.product_id = p.id
    GROUP BY rv.product_id
    ORDER BY view_count DESC
    LIMIT 10
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }

    res.status(200).json(results);
  });
});

module.exports = router;