const express = require('express');
const db = require('../db'); 

const router = express.Router();

//get all products endpoint
router.get('/allproducts', async (req, res) => {
  const query = 'SELECT * FROM products ';
  try {
    const [results] = await db.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get featured products endpoint
router.get('/featured', async (req, res) => {
  const query = `SELECT p.id, p.name, p.image_url, pr.price 
    FROM products p 
    LEFT JOIN product_retailers pr ON p.id = pr.product_id
    ORDER BY p.created_at ASC
    LIMIT 20;`;
  try {
    const [results] = await db.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get trending products endpoint
router.get('/trending', async (req, res) => {
  const query = `
    SELECT p.id, p.name,  p.image_url, COUNT(rv.product_id) AS view_count
    FROM recently_viewed rv
    JOIN products p ON rv.product_id = p.id
    GROUP BY rv.product_id
    ORDER BY view_count DESC
    LIMIT 10
  `;
  try {
    const [results] = await db.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get item details by ID 
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const query = `SELECT p.*, pr.price, pr.retailer_id, r.name as retailer_name, pr.product_url FROM products p
                 LEFT JOIN product_retailers pr ON p.id = pr.product_id
                 LEFT JOIN retailers r ON pr.retailer_id = r.id
                 WHERE p.id = ?`;
  try {
    const [results] = await db.query(query, [id]);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const product = {
      ...results[0],
      prices: results.filter(r => r.price !== null).map(r => ({
        price: r.price,
        retailer_id: r.retailer_id,
        retailer_name: r.retailer_name,
        product_url: r.product_url // Use product_url instead of retailer_url
      }))
    };

    // Always include retailer_name for top-level price if present
    if (product.prices.length === 1) {
      product.price = product.prices[0].price;
      product.retailer_id = product.prices[0].retailer_id;
      product.retailer_name = product.prices[0].retailer_name;
      product.product_url = product.prices[0].product_url;
    } else if (product.price && product.retailer_id) {
      // If multiple prices, try to match top-level price/retailer_id to get retailer_name and product_url
      const match = product.prices.find(p => String(p.price) === String(product.price) && String(p.retailer_id) === String(product.retailer_id));
      if (match) {
        product.retailer_name = match.retailer_name;
        product.product_url = match.product_url;
      }
    }
    res.status(200).json(product);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Search products by name (case-insensitive)
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing search query.' });

  const query = `
    SELECT * FROM products
    WHERE LOWER(name) LIKE LOWER(?)
    LIMIT 50
  `;
  try {
    const [results] = await db.query(query, [`%${q}%`]);
    res.status(200).json(results);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
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
router.post('/sort-products', async (req, res) => {
  const { productIds, userLat, userLng } = req.body;
  if (!Array.isArray(productIds) || typeof userLat !== 'number' || typeof userLng !== 'number') {
    return res.status(400).json({ error: 'Invalid input.' });
  }
  try {
    const query = `
      SELECT pr.product_id, pr.price, r.name as retailer_name, r.url as retailer_url, ra.address, ra.latitude, ra.longitude, pr.retailer_id
      FROM product_retailers pr
      JOIN retailers r ON pr.retailer_id = r.id
      JOIN retailer_addresses ra ON r.id = ra.retailer_id
      WHERE pr.product_id IN (?)
    `;
    const [rows] = await db.query(query, [productIds]);
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;