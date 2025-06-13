const express = require('express');
const router = express.Router();
const db = require('../db.js');
const { authenticateToken } = require('../config/authMiddleware.js');

// Add to cart
router.post('/cart/add', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { product_id } = req.body;
  if (!product_id) {
    return res.status(400).json({ error: 'product_id is required' });
  }
  try {
    const [existing] = await db.query('SELECT * FROM cart WHERE user_id = ? AND product_id = ?', [userId, product_id]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Product already in cart' });
    }
    await db.query('INSERT INTO cart (user_id, product_id) VALUES (?, ?)', [userId, product_id]);
    res.status(201).json({ message: 'Product added to cart' });
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/cart/add-multiple', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { product_ids } = req.body; // expects: { product_ids: [1,2,3,...] }
  if (!Array.isArray(product_ids) || product_ids.length === 0) {
    return res.status(400).json({ error: 'product_ids must be a non-empty array' });
  }

  try {
    const [existing] = await db.query(
      `SELECT product_id FROM cart WHERE user_id = ? AND product_id IN (?)`,
      [userId, product_ids]
    );
    const existingIds = existing.map(e => e.product_id);

    const toInsert = product_ids.filter(id => !existingIds.includes(id));
    if (toInsert.length === 0) {
      return res.status(409).json({ error: 'All products already in cart' });
    }

    const values = toInsert.map(id => [userId, id]);
    await db.query(
      `INSERT INTO cart (user_id, product_id) VALUES ?`,
      [values]
    );

    res.status(201).json({ message: 'Products added to cart', added: toInsert });
  } catch (err) {
    console.error('Error adding multiple to cart:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from cart
router.delete('/cart/delete', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { product_id } = req.body;
  if (!product_id) {
    return res.status(400).json({ error: 'product_id is required' });
  }
  try {
    const [result] = await db.query('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [userId, product_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }
    res.status(200).json({ message: 'Product removed from cart' });
  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to wishlist
router.post('/wishlist/add', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { product_id } = req.body;
  console.log('[WISHLIST][ADD] userId:', userId, 'product_id:', product_id, 'body:', req.body, 'params:', req.params);
  if (!product_id) {
    return res.status(400).json({ error: 'product_id is required' });
  }
  try {
    // Prevent duplicates
    const [existing] = await db.query('SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, product_id]);
    console.log('[WISHLIST][ADD] Existing check result:', existing);
    if (existing.length > 0) {
      console.log('[WISHLIST][ADD] Product already in wishlist');
      return res.status(409).json({ error: 'Product already in wishlist' });
    }
    await db.query('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [userId, product_id]);
    console.log('[WISHLIST][ADD] Product inserted into wishlist');
    res.status(201).json({ message: 'Product added to wishlist' });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from wishlist
router.delete('/wishlist/remove', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { product_id } = req.body;
  console.log('[WISHLIST][REMOVE] userId:', userId, 'product_id:', product_id, 'body:', req.body, 'params:', req.params);
  if (!product_id) {
    return res.status(400).json({ error: 'product_id is required' });
  }
  try {
    const [result] = await db.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, product_id]);
    console.log('[WISHLIST][REMOVE] Delete result:', result);
    if (result.affectedRows === 0) {
      console.log('[WISHLIST][REMOVE] Product not found in wishlist');
      return res.status(404).json({ error: 'Product not found in wishlist' });
    }
    console.log('[WISHLIST][REMOVE] Product removed from wishlist');
    res.status(200).json({ message: 'Product removed from wishlist' });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get wishlist items for the user
router.get('/wishlist/:userId', async (req, res) => {
  const { userId } = req.params;
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });
  console.log('[WISHLIST] GET /wishlist', { userId });
  // Get wishlist items for the user
  const wishlistQuery = `
      SELECT w.product_id, p.name, p.image_url
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
  `;
  try {
    const [wishlist] = await db.query(wishlistQuery, [userId]);
    if (!wishlist.length) return res.json([]);

    const productIds = wishlist.map(w => w.product_id);
    const offersQuery = `
      SELECT pr.product_id, pr.price, r.name as retailer_name, pr.product_url
      FROM product_retailers pr
      JOIN retailers r ON pr.retailer_id = r.id
      WHERE pr.product_id IN (?)
      ORDER BY pr.price ASC
    `;
    const [offers] = await db.query(offersQuery, [productIds]);

    // Group offers by product_id and take up to 3 competitors for each
    const offersByProduct = {};
    offers.forEach(function(o) {
      if (!offersByProduct[o.product_id]) {
        offersByProduct[o.product_id] = [];
      }
      if (offersByProduct[o.product_id].length < 3) {
        offersByProduct[o.product_id].push(o);
      }
    });

    // Combine wishlist items with their competitor offers
    const result = wishlist.map(item => ({
      ...item,
      competitors: offersByProduct[item.product_id] || []
    }));

    res.json(result);
  } catch (err) {
    console.error('Wishlist query error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get specific wishlist item
router.get('/wishlist/:productId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const productId = req.params.productId;
  console.log('[WISHLIST] GET /wishlist/:productId', { userId, productId });
  try {
    const [wishlist] = await db.query(
      `SELECT p.*, pr.price
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN product_retailers pr ON p.id = pr.product_id
       WHERE w.user_id = ? AND w.product_id = ?`,
      [userId, productId]
    );
    if (wishlist.length === 0) {
      console.log('[WISHLIST] Product not found in wishlist');
      return res.status(404).json({ error: 'Product not found in wishlist' });
    }
    res.status(200).json(wishlist[0]);
  } catch (err) {
    console.error('[WISHLIST] DB ERROR:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Fetch cart items for the user
router.get('/cart', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const [cart] = await db.query(
      `SELECT c.product_id, p.name, p.image_url
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [userId]
    );
    if (!cart.length) return res.json([]);

    const productIds = cart.map(item => item.product_id);
    const [offers] = await db.query(
      `SELECT pr.product_id, pr.price, r.id as retailer_id, r.name as retailer_name, pr.product_url
       FROM product_retailers pr
       JOIN retailers r ON pr.retailer_id = r.id
       WHERE pr.product_id IN (?)
       ORDER BY pr.price ASC`,
      [productIds]
    );

    const offersByProduct = {};
    offers.forEach(o => {
      if (!offersByProduct[o.product_id]) offersByProduct[o.product_id] = [];
      offersByProduct[o.product_id].push(o);
    });

    const result = cart.map(item => ({
      ...item,
      competitors: offersByProduct[item.product_id] || []
    }));

    res.json(result);
  } catch (err) {
    console.error('Cart fetch error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;