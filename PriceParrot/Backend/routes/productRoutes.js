const express = require('express');
const db = require('../db'); 

const router = express.Router();

//get all products endpoint
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

// Get featured products endpoint
router.get('/featured', (req, res) => {
  const query = `SELECT p.id, p.name, p.image_url, pr.price FROM 
      products p
    LEFT JOIN 
      product_retailers pr
    ON 
      p.id = pr.product_id
    LIMIT 50;`;
  db.query(query, (err, results) => {
    if (err) {
      console.log('The current results:',results);
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }

    res.status(200).json(results);
  });
});

// Get trending products endpoint
router.get('/trending', (req, res) => {
  const query = `
    SELECT p.id, p.name,  p.image_url, COUNT(rv.product_id) AS view_count
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

// Get item details by ID 
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM products WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    res.status(200).json(results[0]);
  });
});

module.exports = router;