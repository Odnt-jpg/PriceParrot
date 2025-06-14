const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || '5230958904590';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // console.log('AUTH HEADER:', authHeader); // Debug log
  const token = authHeader && authHeader.split(' ')[1];
  // console.log('TOKEN:', token); // Debug log
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      // console.log('JWT VERIFY ERROR:', err); // Debug log
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };
