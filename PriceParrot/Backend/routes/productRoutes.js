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
  const query = `SELECT p.*, pr.price, pr.retailer_id FROM products p
                 LEFT JOIN product_retailers pr ON p.id = pr.product_id
                 WHERE p.id = ?`;
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    // If there are multiple retailers, return all prices
    const product = {
      ...results[0],
      prices: results.filter(r => r.price !== null).map(r => ({ price: r.price, retailer_id: r.retailer_id }))
    };
    // If only one price, keep compatibility
    if (product.prices.length === 1) {
      product.price = product.prices[0].price;
      product.retailer_id = product.prices[0].retailer_id;
    }
    res.status(200).json(product);
  });
});

// Utility: Haversine formula for distance in km
function haversine(lat1, lon1, lat2, lon2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// POST /sort-products: Sorts products or cart by price and proximity
router.post('/sort-products', (req, res) => {
  const { productIds, userLat, userLng } = req.body;
  if (!Array.isArray(productIds) || typeof userLat !== 'number' || typeof userLng !== 'number') {
    return res.status(400).json({ error: 'Invalid input.' });
  }
  try {
    const query = `
      SELECT pr.product_id, pr.price, r.name as retailer_name, ra.address, ra.latitude, ra.longitude, pr.retailer_id
      FROM product_retailers pr
      JOIN retailers r ON pr.retailer_id = r.id
      JOIN retailer_addresses ra ON r.id = ra.retailer_id
      WHERE pr.product_id IN (?)
    `;
    db.query(query, [productIds], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
      }
      // For each product, find the best offer (lowest price, then closest)
      const bestOffers = [];
      for (const pid of productIds) {
        const offers = rows.filter(row => row.product_id === pid);
        offers.forEach(o => {
          o.distance = haversine(userLat, userLng, o.latitude, o.longitude);
        });
        offers.sort((a, b) => a.price - b.price || a.distance - b.distance);
        if (offers.length > 0) bestOffers.push(offers[0]);
      }
      // For a cart, sum the prices and distances
      const totalPrice = bestOffers.reduce((sum, o) => sum + parseFloat(o.price), 0);
      const totalDistance = bestOffers.reduce((sum, o) => sum + o.distance, 0);
      res.json({ bestOffers, totalPrice, totalDistance });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;